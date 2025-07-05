const awsConfig = {
    Auth: {
      // Required for Cognito User Pool auth
      region: 'us-east-1',
      userPoolId: 'us-east-1_lcZMlbm3c',
      userPoolWebClientId: '5p646eiimag416fhhai5bhgrf6',
      mandatorySignIn: false,
     // Even if you’re not using hosted UI, Amplify UI code expects this key to exist
      oauth: {}
    },
    API: {
      endpoints: [
        {
          name: "WorkoutAPI",
          endpoint: "https://4tb1rc24q2.execute-api.us-east-1.amazonaws.com/Prod",
          region: "us-east-1"
        }
      ]
    }
  };
  export default awsConfig;