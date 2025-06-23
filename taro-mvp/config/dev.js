module.exports = {
  env: {
    NODE_ENV: '"development"'
  },
  defineConstants: {
    ENABLE_INNER_HTML: true,
    ENABLE_ADJACENT_HTML: true,
    ENABLE_SIZE_APIS: true,
    ENABLE_TEMPLATE_CONTENT: true,
    ENABLE_MUTATION_OBSERVER: true,
    ENABLE_CLONE_NODE: true,
    ENABLE_CONTAINS: true
  },
  mini: {},
  h5: {
    devServer: {
      port: 10086,
      host: 'localhost'
    }
  }
} 