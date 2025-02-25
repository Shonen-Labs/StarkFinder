module.exports = {
  //...
  watchOptions: {
    ignored: ['**/node_modules', path.posix.resolve(__dirname, './public')],
  },
};