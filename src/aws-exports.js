const awsConfig = {
  // Your existing API config
  API: {
    endpoints: [
      {
        name: "WorkoutAPI",
        endpoint: "https://4tb1rc24q2.execute-api.us-east-1.amazonaws.com/Prod",
        region: "us-east-1"
      }
    ]
  },

  // Cognito configuration
  Auth: {
    region: 'us-east-1',
    userPoolId: 'us-east-1_lcZMlbm3c',
    userPoolWebClientId: '68peajep7rg98ti9dtr76q8s1l',
    authenticationFlowType: 'USER_SRP_AUTH' // Recommended flow
  }
};

export default awsConfig;