import babel from 'rollup-plugin-babel';
import postcss from 'rollup-plugin-postcss';
export default {
  input: 'src/index.js',
  output: {
    file: 'build/index.js',
    format: 'esm', // Might want to use umd if we have issues with esm
  },
  plugins: [
    babel({
      exclude: 'node_modules/**'
    }),
    postcss({
      extensions: [ '.css' ]
    })
  ],
  external: ['react']
}
