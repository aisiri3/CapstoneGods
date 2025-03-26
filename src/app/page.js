// Landing page: This is automatically rendered at localhost:3000/
// We will use the signin page as the landing page

import SignIn from "./auth/signin/page";

export default function Home() {
  return <SignIn />;
}
