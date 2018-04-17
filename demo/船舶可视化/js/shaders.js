/*------------------------------------------------------------------------------------*/

var V_pt_shader = `
    attribute vec4 a_pos;
    void main(){
        gl_Position = a_pos;
        gl_PointSize = 10.0;
    }
`;
var F_pt_shader = `
    void main(){
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    }
`;

/*------------------------------------------------------------------------------------*/

var V_line_shader = `
    precision highp float;
    attribute float a_index;
    uniform float u_width;
    uniform float u_height;
    uniform mat4 u_matrix;
    uniform float u_line_length;
    uniform float u_r;
    varying vec2 v_pos;
    varying vec2 v_tex_pos;
    varying float v_line_length;
    varying float v_r;
    void main(){
        // to extract the pos(max: 1.0) of the point
        float x = fract(a_index / u_width);
        float y = a_index / (u_width * u_height);

        // tranfer coord from [0.0 ~ 1.0] to [-1.0 ~ 1.0]
        x = 2.0 * x - 1.0;
        y = 2.0 * y - 1.0;

        gl_Position = u_matrix * vec4(x, y, 0.0, 1.0);
        gl_PointSize = 1.0;

        v_pos = vec2(x * u_width / 2.0, y * u_height / 2.0);
        v_tex_pos = 0.5 * vec2(gl_Position) + 0.5;
        v_line_length = u_line_length / 2.0;
        v_r = u_r;
    }
`;
var F_line_shader = `
    precision highp float;
    uniform sampler2D u_sampler_screen;
    varying vec2 v_pos;
    varying vec2 v_tex_pos;
    varying float v_line_length;
    varying float v_r;
    void main(){
        float dis;
        if(v_pos[0] > v_line_length){
            dis = distance(v_pos, vec2(v_line_length, 0.0));
        }else if(v_pos[0] < -v_line_length){
            dis = distance(v_pos, vec2(-v_line_length, 0.0));
        }else{
            dis = abs(v_pos[1]);
        }

        float grey_level;
        if(dis > v_r){
            grey_level = 1.0;
        }else{
            grey_level = dis / v_r;
        }

        vec4 screen_color = texture2D(u_sampler_screen, v_tex_pos);
        float screen_level = screen_color[0];
        if(screen_level < grey_level){
            grey_level = screen_level;
        }

        gl_FragColor = vec4(grey_level * vec3(1.0, 1.0, 1.0), 1.0);
    }
`;

/*------------------------------------------------------------------------------------*/

/* efficient but bad-in-visualization version */

// var V_draw_shader = `
//     precision highp float;
//     attribute vec2 a_tex_pos;
//     varying vec2 v_tex_pos;
//     void main(){
//         gl_Position = vec4(2.0 * a_tex_pos - 1.0, 0.0, 1.0);
//         v_tex_pos = a_tex_pos;
//     }
// `;
//
// var F_draw_shader = `
//     precision highp float;
//     uniform sampler2D u_sampler;
//     varying vec2 v_tex_pos;
//     void main(){
//         gl_FragColor = texture2D(u_sampler, v_tex_pos);
//     }
// `;


/* inefficient but good-in-visualization  version*/

var V_draw_shader = `
    precision highp float;
    attribute float a_index;
    uniform float u_width;
    uniform float u_height;
    varying vec2 v_pos;
    void main() {
        // to extract the pos(max: 1.0) of the point
        float x = fract(a_index / u_width);
        float y = a_index / (u_width * u_height);

        v_pos = vec2(x, y);

        // tranfer coord from [0.0 ~ 1.0] to [-1.0 ~ 1.0]
        x = 2.0 * x - 1.0;
        y = 2.0 * y - 1.0;

        gl_Position = vec4(x, y, 0.0, 1.0);
        gl_PointSize = 1.0;
    }
`;

var F_draw_shader = `
    precision highp float;
    uniform sampler2D u_sampler;
    varying vec2 v_pos;
    void main() {
        gl_FragColor = texture2D(u_sampler, v_pos);
    }
`;

/*------------------------------------------------------------------------------------*/

var V_color_shader = `
    precision highp float;
    attribute float a_index;
    uniform float u_width;
    uniform float u_height;
    varying vec2 v_pos;
    void main() {
        // to extract the pos(max: 1.0) of the point
        float x = fract(a_index / u_width);
        float y = a_index / (u_width * u_height);

        v_pos = vec2(x, y);

        // tranfer coord from [0.0 ~ 1.0] to [-1.0 ~ 1.0]
        x = 2.0 * x - 1.0;
        y = 2.0 * y - 1.0;

        gl_Position = vec4(x, y, 0.0, 1.0);
        gl_PointSize = 1.0;
    }
`;

var F_color_shader = `
    precision highp float;
    uniform sampler2D u_sampler;
    varying vec2 v_pos;

    float gradient(float min, float max, float level){
        level = level > 1.0 ? 1.0 : level;
        return ((max - min) * level + min);
    }

    float log_gradient(float min, float max, float level){
        float log_min = log(min);
        float log_max = log(max);
        float log_result = gradient(log_min, log_max, level);
        return exp(log_result);
    }

    void main() {
        vec4 color = texture2D(u_sampler, v_pos);
        float density = 1.0 - color[0];
        if(density == 0.0){
            gl_FragColor = color;
        }else {
            float r, g, b;
            r = gradient(0.94, 0.91, density);
            g = gradient(0.94, 0.0, density);
            b = gradient(0.44, 0.09, density);
            gl_FragColor = vec4(r, g, b, 1.0);
        }
    }

`;

/*------------------------------------------------------------------------------------*/

var V_normal_shader = `
    precision highp float;
    attribute float a_index;
    uniform float u_width;
    uniform float u_height;
    varying vec2 v_pos;
    varying vec2 v_offset;
    void main() {
        // to extract the pos(max: 1.0) of the point
        float x = fract(a_index / u_width);
        float y = a_index / (u_width * u_height);

        v_pos = vec2(x, y);

        // tranfer coord from [0.0 ~ 1.0] to [-1.0 ~ 1.0]
        x = 2.0 * x - 1.0;
        y = 2.0 * y - 1.0;

        gl_Position = vec4(x, y, 0.0, 1.0);
        gl_PointSize = 1.0;
        v_offset = vec2(1.0 / u_width, 1.0 / u_height);
    }
`;

var F_normal_shader = `
    precision highp float;
    uniform sampler2D u_sampler;
    varying vec2 v_pos;
    varying vec2 v_offset;
    float get_density(sampler2D tex, vec2 tex_pos) {
        vec4 color = texture2D(tex, tex_pos);
        return 1.0 - color[0];
    }
    void main() {
        float S = get_density(u_sampler, vec2(v_pos[0] + v_offset[0], v_pos[1])) - get_density(u_sampler, vec2(v_pos[0] - v_offset[0], v_pos[1]));
        float T = get_density(u_sampler, vec2(v_pos[0], v_pos[1] + v_offset[1])) - get_density(u_sampler, vec2(v_pos[0], v_pos[1] - v_offset[1]));
        vec3 normal = cross(vec3(1.0, 0.0, S), vec3(0.0, 1.0, T));
        normal = normal * 0.5 + 0.5;
        gl_FragColor = vec4(normal, 1.0);
    }
`;
/*------------------------------------------------------------------------------------*/

var V_result_shader = `
precision highp float;
attribute float a_index;
uniform float u_width;
uniform float u_height;
uniform vec3 u_lightDirection;
varying vec3 v_lightDirection;
varying vec2 v_pos;
void main() {
    // to extract the pos(max: 1.0) of the point
    float x = fract(a_index / u_width);
    float y = a_index / (u_width * u_height);

    v_pos = vec2(x, y);

    // tranfer coord from [0.0 ~ 1.0] to [-1.0 ~ 1.0]
    x = 2.0 * x - 1.0;
    y = 2.0 * y - 1.0;

    gl_Position = vec4(x, y, 0.0, 1.0);
    gl_PointSize = 1.0;
    v_lightDirection = u_lightDirection;
}
`;

var F_result_shader = `
    precision highp float;
    uniform sampler2D u_sampler_color;
    uniform sampler2D u_sampler_normal;
    varying vec3 v_lightDirection;
    varying vec2 v_pos;
    void main() {
        vec4 color = texture2D(u_sampler_color, v_pos);
        vec3 normal = texture2D(u_sampler_normal, v_pos).rgb * 2.0 - 1.0;
        normal = normalize(normal);
        vec3 lightDirection = normalize(v_lightDirection);

        float cos = max(dot(lightDirection, normal), 0.1);
        vec3 diffuse = vec3(1.0, 1.0, 1.0) * vec3(color) * cos;
        if(color[0] == 1.0){
            gl_FragColor = color;
        }else{
            gl_FragColor = vec4(diffuse, 1.0);
        }
    }
`;
