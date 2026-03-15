import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, RotateCw, FileDown, Database, Link as LinkIcon, Eye, EyeOff, HelpCircle } from 'lucide-react';

const MainLayout = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [focusMode, setFocusMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // These will be passed to children via Outlet context
  const context = {
    searchQuery,
    setSearchQuery,
    focusMode,
    setFocusMode,
    refreshing,
    setRefreshing
  };

  const btnMotion = { whileHover: { scale: 1.02, y: -1 }, whileTap: { scale: 0.97 } };

  return (
    <div className="min-h-screen flex flex-col ambient-bg">
      {/* Shared Header can go here if we want it on all pages */}
      {/* For now, let's keep it flexible and just provide the container */}
      <Outlet context={context} />
    </div>
  );
};

export default MainLayout;
