const CSS_MODULE_LOCAL_IDENT_NAME = "[name]_[local]_[hash:base64:5]";

module.exports = {
  style: {
    modules: {
      localIdentName: CSS_MODULE_LOCAL_IDENT_NAME,
    },
  },
  sass: {
    includePaths: ["./src"],
  },
  babel: {
    plugins: [
      [
        "babel-plugin-react-css-modules",
        {
          generateScopedName: CSS_MODULE_LOCAL_IDENT_NAME,
          attributeNames: { activeStyleName: "activeClassName" },
          filetypes: {
            ".scss": {
              syntax: "postcss-scss",
            },
          },
        },
      ],
    ],
  },
};
