'use client';

import { Button } from "@/components/ui/button";
import { PlusIcon, RefreshIcon } from "lucide-react";
import { useState } from "react";

interface CrudToolbarProps {
  title: string;
  onAddNew: () => void;
  onRefresh: () => void;
}

export function CrudToolbar({ title, onAddNew, onRefresh }: CrudToolbarProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  };

  return (
    <div className="flex items-center justify-between pb-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="flex space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshIcon className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        <Button 
          variant="default" 
          size="sm" 
          onClick={onAddNew}
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add New
        </Button>
      </div>
    </div>
  );
}
