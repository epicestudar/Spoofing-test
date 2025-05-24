import EmailForm from "./EmailForm";
import { useAuth } from "react-oidc-context";

function App() {
  const auth = useAuth();


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