// src/aws-exports.js
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
    region: 'us-east-1',
    userPoolId: 'us-east-1_lcZMlbm3c',
    userPoolWebClientId: '5p646eiimag416fhhai5bhgrf6',
    // No loginWith field here – only include necessary Auth settings
    oauth: {
      redirectSignIn: ['https://main.d1atihsq0v31p5.amplifyapp.com'],
      redirectSignOut: ['https://main.d1atihsq0v31p5.amplifyapp.com'],
      responseType: 'code'
    }
  }
};

export default awsConfig;
