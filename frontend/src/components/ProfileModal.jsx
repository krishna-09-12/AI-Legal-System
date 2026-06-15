import { useState } from "react";
import { X, Mail, Lock, User, Save, ShieldCheck, Phone, MapPin } from "lucide-react";
import { updateProfile } from "../lib/api";

export default function ProfileModal({ isOpen, onClose, user, onUpdateSuccess }) {
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || "");
  const [address, setAddress] = useState(user?.address || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changePassword, setChangePassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const data = await updateProfile(
        fullName,
        phoneNumber,
        address,
        changePassword ? currentPassword : null,
        changePassword ? newPassword : null
      );
      
      setSuccess("Profile updated successfully!");
      onUpdateSuccess(data.token, data.user);
      
      // Clear password fields
      setCurrentPassword("");
      setNewPassword("");
      setChangePassword(false);
      
      // Auto close after 1.5 seconds
      setTimeout(() => {
        onClose();
        setSuccess("");
      }, 1500);
      
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update profile. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Glassmorphic Card */}
      <div className="relative w-full max-w-md overflow-hidden bg-slate-900/80 backdrop-blur-2xl border border-slate-800/80 rounded-3xl shadow-[0_20px_50px_rgba(99,102,241,0.2)] p-8">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors duration-150"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Decorative Badge */}
        <div className="flex justify-center mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5" />
            Account Security
          </span>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-black text-center text-white mb-1">
          Profile Settings
        </h2>
        <p className="text-xs text-center text-slate-400 mb-6">
          View and update your personal credentials.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-400 text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 text-center">
            {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                placeholder="Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 focus:border-indigo-500 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none transition-colors duration-200"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="tel"
                placeholder="9876543210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ""))}
                className="w-full bg-slate-950/50 border border-slate-800 focus:border-indigo-500 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none transition-colors duration-200"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Address</label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <textarea
                placeholder="123 Street, Area, City, State"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                className="w-full bg-slate-950/50 border border-slate-800 focus:border-indigo-500 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none transition-colors duration-200 resize-none"
              />
            </div>
          </div>

          {/* Email (Read Only) */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address (Primary ID)</label>
            <div className="relative opacity-60">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                disabled
                value={user?.email || ""}
                className="w-full bg-slate-950 border border-slate-900 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-400 cursor-not-allowed outline-none"
              />
            </div>
          </div>

          {/* Change Password Toggle */}
          <div className="pt-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="changePassword"
              checked={changePassword}
              onChange={(e) => setChangePassword(e.target.checked)}
              className="w-4 h-4 rounded border-slate-800 bg-slate-950 focus:ring-indigo-500 text-indigo-600 cursor-pointer"
            />
            <label 
              htmlFor="changePassword"
              className="text-xs font-bold text-slate-300 select-none cursor-pointer uppercase tracking-wider"
            >
              Update Password
            </label>
          </div>

          {/* Password Fields */}
          {changePassword && (
            <div className="space-y-4 pt-2 animate-in slide-in-from-top-2 duration-150">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Current Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 focus:border-indigo-500 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none transition-colors duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 focus:border-indigo-500 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none transition-colors duration-200"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold py-3.5 px-4 rounded-xl text-sm shadow-lg hover:shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider mt-6"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
