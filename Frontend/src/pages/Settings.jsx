import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, UploadSimple } from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { userApi, uploadApi } from "@/lib/services";
import UserAvatar from "@/components/shared/UserAvatar";
import ThemeToggle from "@/components/shared/ThemeToggle";

export default function Settings() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const updated = await userApi.updateProfile({ fullName, bio });
      const u = updated?.data ?? updated;
      setUser(u);
      toast.success("Profile updated");
    } catch (e) { toast.error(e?.response?.data?.message || "Could not save"); }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (!currentPassword || !newPassword) return toast.error("Fill both password fields");
    if (newPassword.length < 8) return toast.error("Password must be 8+ characters");
    try {
      await userApi.changePassword({ currentPassword, newPassword });
      toast.success("Password changed");
      setCurrentPassword(""); setNewPassword("");
    } catch (e) { toast.error(e?.response?.data?.message || "Change failed"); }
  };

  const onAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadApi.avatar(file);
      const url = res?.url || res?.data?.url || res?.profileImageUrl;
      if (url) {
        const updated = await userApi.updateProfile({ profileImageUrl: url });
        setUser(updated?.data ?? updated);
      }
      toast.success("Avatar updated");
    } catch (e) { toast.error(e?.response?.data?.message || "Upload failed"); }
    finally { setUploading(false); }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-40 bg-background/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} /> Back to dashboard
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="label-mono mb-2">preferences</div>
        <h1 className="text-3xl font-bold tracking-tight mb-10">Settings</h1>

        <section className="rounded-2xl border p-6 mb-8">
          <h2 className="text-lg font-semibold tracking-tight mb-6">Profile</h2>
          <div className="flex items-center gap-5 mb-6">
            <UserAvatar user={user} size={72} />
            <label className="cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={onAvatar} data-testid="avatar-upload-input" />
              <div className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border hover:bg-accent transition-colors text-sm">
                <UploadSimple size={16} /> {uploading ? "Uploading…" : "Change avatar"}
              </div>
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} data-testid="settings-name-input" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Bio</Label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} data-testid="settings-bio-input" />
            </div>
          </div>
          <div className="mt-6"><Button onClick={saveProfile} disabled={saving} data-testid="settings-save-btn">{saving ? "Saving…" : "Save changes"}</Button></div>
        </section>

        <section className="rounded-2xl border p-6 mb-8">
          <h2 className="text-lg font-semibold tracking-tight mb-6">Password</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Current password</Label>
              <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} data-testid="current-pw-input" />
            </div>
            <div className="space-y-1.5">
              <Label>New password</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} data-testid="new-pw-input" />
            </div>
          </div>
          <div className="mt-6"><Button variant="outline" onClick={changePassword} data-testid="change-pw-btn">Update password</Button></div>
        </section>

        <section className="rounded-2xl border p-6 border-destructive/40">
          <h2 className="text-lg font-semibold tracking-tight mb-2 text-destructive">Danger zone</h2>
          <p className="text-sm text-muted-foreground mb-4">Sign out of this device.</p>
          <Button variant="destructive" onClick={async () => { await logout(); navigate("/login"); }} data-testid="settings-logout-btn">Sign out</Button>
        </section>
      </main>
    </div>
  );
}
