import React from 'react';
import { UserMenu } from '../UserMenu';
import { DEBUG_USER } from '../../../config/constants';

export const DebugUserMenu: React.FC = () => (
  <div className="flex justify-end px-4 py-2 border-b">
    <UserMenu user={{
      ...DEBUG_USER,
      photoURL: 'https://wwfgifts-files.worldwildlife.org/wwfgifts/images/capuchin-monkey-large-photo.jpg'
    }} />
  </div>
);