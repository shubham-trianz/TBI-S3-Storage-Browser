import Profile from "./Profile";
import logo from '../../assets/logo.png';


export default function Header({
  displayName,
  signOut,
}: {
  displayName: string;
  signOut?: () => void;
}) {
  return (
    <div className="header">
      <div className="header-left">
        <img src={logo} alt="TBI Logo" height={100} />
        <h1>Digital Evidence Management System</h1>
      </div>
      <Profile displayName={displayName} signOut={signOut}/>
    </div>
  );
}