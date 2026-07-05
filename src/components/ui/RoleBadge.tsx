import React from 'react';
import { Loader2, Crown, User } from 'lucide-react';
import { translateRole } from '../../utils/customer';

interface RoleBadgeProps {
  role: string | null | undefined;
  isVipMember?: boolean | null;
  isLoading?: boolean;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, isVipMember, isLoading }) => {
  if (isLoading) {
    return (
      <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 flex items-center gap-1">
        <Loader2 className="animate-spin" size={14} />
        <span>טוען...</span>
      </span>
    );
  }

  const isVIP = typeof isVipMember === 'boolean'
    ? isVipMember
    : role?.toLowerCase() === 'wholesale_customer';
  const translatedRole = isVIP ? 'לקוח VIP' : translateRole(role);

  const getRoleStyles = () => {
    if (isVIP) {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleStyles()} flex items-center gap-1`}>
      {isVIP ? <Crown size={14} /> : <User size={14} />}
      <span>{translatedRole}</span>
    </span>
  );
};