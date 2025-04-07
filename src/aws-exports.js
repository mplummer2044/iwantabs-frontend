const awsConfig = {
  API: {
    endpoints: [
      {
        name: "WorkoutAPI",
        endpoint: "https://4tb1rc24q2.execute-api.us-east-1.amazonaws.com/Prod",
        region: "us-east-1"
      }
    ]
  },
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_lcZMlbm3c',
      userPoolClientId: '68peajep7rg98ti9dtr76q8s1l',
      loginWith: {
        oauth: {
          redirectSignIn: ['https://main.d1atihsq0v31p5.amplifyapp.com'],
          redirectSignOut: ['https://main.d1atihsq0v31p5.amplifyapp.com'],
          responseType: 'code'
        }
      }
    }
  }
};

export default awsConfig;