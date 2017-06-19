# Workflow starter NanoGL

### Prerequisties
```
npm install -g workflow-cli
npm install
```

### Main tasks

```
wk compile
wk watch
wk build
wk server
```

### Release
```
ENV={target env} wk build
```

### Available tasks
```
wk
```

### GLSL

`.glsl`, `.vert` and `.frag` files use nanogl-template transform.

`demo.glsl`
```glsl
void demo( in vec3 color ) {
  return color * 1.0;
}
```

`basic.frag`
```glsl
{{ require('./demo.glsl') }}

void main() {
  gl_FragColor = vec4(demo(vec3(1.0, 0.0, 0.0)), 1.0);
}
```

Output:
```glsl
void demo( in vec3 color ) {
  return color * 1.0;
}

void main() {
  gl_FragColor = vec4(demo(vec3(1.0, 0.0, 0.0)), 1.0);
}
```