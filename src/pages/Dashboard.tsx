import { logoutUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  return (
    <div>
      This is the Dashboard page
      <Button
        onClick={() => {
          logoutUser();
          window.location.href = "/";
        }}
      >
        Logout
      </Button>
      ;
    </div>
  );
}
