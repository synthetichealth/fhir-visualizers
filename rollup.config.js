import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';

export default {
  input: 'src/index.js',
  output: {
    file: 'index.js',
    format: 'esm', // Might want to use umd if we have issues with esm
  },
  plugins: [
    babel({
      exclude: 'node_modules/**'
    })
  ],
  external: ['react']
}
