import { UserForm } from "@/components/users/UserForm";

export default function NewUserPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">New user</h1>
      <UserForm />
    </div>
  );
}
