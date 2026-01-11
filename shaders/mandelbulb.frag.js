export const fsSource = `
    precision highp float;
    uniform float u_time, u_zoom;
    uniform vec2 u_res;
    uniform mat3 u_rot;
    uniform bool u_heavy;
    uniform int u_q;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.989, 78.233))) * 43758.545); }

    float map(vec3 p) {
        vec3 z = p;
        float dr = 1.0, r = 0.0;
        int it = u_heavy ? (15 + u_q * 3) : (8 + u_q * 2);
        for (int i = 0; i < 40; i++) {
            if (i >= it) break;
            r = length(z); if (r > 4.0) break;
            float p8 = pow(r, 7.0);
            float t = acos(clamp(z.z/r, -0.999, 0.999)) * 8.0;
            float f = atan(z.y, z.x) * 8.0;
            dr = p8 * 8.0 * dr + 1.0;
            z = p8 * r * vec3(sin(t)*cos(f), sin(f)*sin(t), cos(t)) + p;
        }
        return 0.5 * log(r) * r / dr;
    }

    vec3 render(vec2 fc) {
        vec2 uv = (fc - 0.5 * u_res) / min(u_res.y, u_res.x);
        vec3 ro = u_rot * vec3(0.0, 0.0, u_zoom);
        vec3 rd = u_rot * normalize(vec3(uv, -2.5));
        float t = 0.0, d, glow = 0.0;
        int st = u_heavy ? (160 + u_q * 45) : (80 + u_q * 25);
        for(int i=0; i<400; i++) {
            if(i >= st || t > 11.0) break;
            d = map(ro + rd * t);
            if(d < 0.0008) break;
            t += d * (u_heavy ? 0.45 : 0.65);
            glow += (0.01 / d) * 0.1;
        }
        vec3 col = vec3(0.0);
        if(t < 11.0) {
            vec3 p = ro + rd * t, e = vec2(0.0002, 0.0).xyy;
            vec3 n = normalize(vec3(map(p+e.xyy)-map(p-e.xyy), map(p+e.yxy)-map(p-e.yxy), map(p+e.yyx)-map(p-e.yyx)));
            vec3 l = normalize(vec3(1.0, 1.5, 0.8));
            vec3 base = 0.5 + 0.5 * cos(u_time * 0.15 + length(p) * 0.4 + vec3(0,1,2));
            col = base * (max(dot(n, l), 0.0) * 0.8 + 0.2) + pow(max(dot(reflect(rd, n), l), 0.0), 32.0);
        }
        return col + vec3(0.05, 0.1, 0.15) * glow;
    }

    void main() {
        vec2 jit = (vec2(hash(gl_FragCoord.xy + u_time), hash(gl_FragCoord.xy + 1.2)) - 0.5) / u_res;
        vec3 c = (render(gl_FragCoord.xy) + render(gl_FragCoord.xy + jit)) * 0.5;
        gl_FragColor = vec4(pow(c, vec3(0.85)), 1.0);
    }
`;
