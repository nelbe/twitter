const config = {
  endpoints: {
    getUser: {
      url: 'account/user/',
      method: 'GET',
      jsonContent: true,
      authRequired: true,
    },
  },
};

export default config;
