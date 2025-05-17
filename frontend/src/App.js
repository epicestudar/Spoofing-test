import EmailForm from "./EmailForm";
import { useAuth } from "react-oidc-context";

function App() {
  const auth = useAuth();

  /* const signOutRedirect = () => {
    const clientId = "3cbq9ddkoo315uitikln08qji3";
    const logoutUri = "<logout uri>";
    const cognitoDomain = "https://us-east-16qqfkl2rm.auth.us-east-1.amazoncognito.com";
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  }; */

  if (auth.isLoading) {
    return <div>Loading...</div>;
  }

  if (auth.error) {
    return <div>Encountering error... {auth.error.message}</div>;
  }

  if (auth.isAuthenticated) {
    return (
       <EmailForm />
    );
  }

  return (auth.signinRedirect()
  );
}

export default App;