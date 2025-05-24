  
  const cognitoAuthConfig = {
  authority: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_6qqfkL2Rm",
  client_id: "3cbq9ddkoo315uitikln08qji3",
  redirect_uri: "https://dmarc-validator.ops.team/",
  response_type: "code",
  scope: "email openid",
};

export default cognitoAuthConfig;
export const logoutUri = "https://dmarc-validator.ops.team/";
export const clientId = "3cbq9ddkoo315uitikln08qji3";
export const cognitoDomain = "https://us-east-16qqfkl2rm.auth.us-east-1.amazoncognito.com";

