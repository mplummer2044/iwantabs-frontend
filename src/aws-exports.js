const awsConfig = {
    Auth: {
      // Region where your Cognito User Pool lives
      region: 'us-east-1',
      // Your User Pool ID
      userPoolId: 'us-east-1_lcZMlbm3c',
      // Your User Pool App Client ID
      userPoolWebClientId: '5p646eiimag416fhhai5bhgrf6',
      // Optional: require signin for every API call
      mandatorySignIn: false,
      // If you later add Hosted UI / OAuth, you can enable:
      // oauth: {
      //   domain: 'your-domain.auth.us-east-1.amazoncognito.com',
      //   scope: ['openid','email','profile'],
      //   redirectSignIn: 'https://main.d1atihsq0v31p5.amplifyapp.com/',
      //   redirectSignOut: 'https://main.d1atihsq0v31p5.amplifyapp.com/',
      //   responseType: 'code'
      // },
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