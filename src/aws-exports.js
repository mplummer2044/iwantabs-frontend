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
    // REQUIRED - Amazon Cognito Region
    region: "us-east-1",
    // OPTIONAL - Amazon Cognito User Pool ID
    userPoolId: "us-east-1_lcZMlbm3c",
    // OPTIONAL - Amazon Cognito Web Client ID (26-char alphanumeric string)
    userPoolWebClientId: "5p646eiimag416fhhai5bhgrf6"
    // (If you need OAuth flows, you can add an `oauth` block here)
  }
};

export default awsConfig;
