import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { IoChatbubbleEllipsesOutline, IoCalendarOutline, IoCallOutline } from 'react-icons/io5';
import { TbCheckbox } from 'react-icons/tb';
import { HiOutlineUserGroup } from 'react-icons/hi';

interface TeamComponentProps {
  onChatSelect?: (userId: string) => void;
}

const TeamComponent: React.FC<TeamComponentProps> = ({ onChatSelect }) => {
  const { data: session } = useSession();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/getAllUsers');
        if (response.ok) {
          const data = await response.json();
          const filteredUsers = data.filter(user => user.id !== session?.user?.id);
          setUsers(filteredUsers);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchUsers();
    }
  }, [session?.user?.id]);

  const getInitials = (name, email) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('');
    }
    return email ? email[0].toUpperCase() : '?';
  };

  const handleMessageClick = (userId: string) => {
    if (onChatSelect) {
      onChatSelect(userId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Team Overview Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Team Members</p>
                <h3 className="text-2xl font-bold">{users.length}</h3>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                <HiOutlineUserGroup className="w-6 h-6 text-purple-600 dark:text-purple-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Active Projects</p>
                <h3 className="text-2xl font-bold">12</h3>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <TbCheckbox className="w-6 h-6 text-blue-600 dark:text-blue-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Scheduled Meetings</p>
                <h3 className="text-2xl font-bold">8</h3>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <IoCalendarOutline className="w-6 h-6 text-green-600 dark:text-green-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tasks Due Today</p>
                <h3 className="text-2xl font-bold">15</h3>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
                <TbCheckbox className="w-6 h-6 text-orange-600 dark:text-orange-300" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members Grid */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map((user) => (
                <Card key={user.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-purple-600 text-white">
                            {getInitials(user.name, user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white bg-gray-500" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{user.name || 'Unnamed User'}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <TbCheckbox className="w-4 h-4" />
                        <span>Active Projects: 0</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <IoCalendarOutline className="w-4 h-4" />
                        <span>Next Meeting: Not Scheduled</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <IoChatbubbleEllipsesOutline className="w-4 h-4" />
                        <span>0 Tasks Completed</span>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button className="flex-1 p-2 text-sm rounded-md bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-white/85 hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors">
                        <IoCallOutline className="w-4 h-4 inline mr-1" />
                        Call
                      </button>
                      <button 
                        onClick={() => handleMessageClick(user.id)}
                        className="flex-1 p-2 text-sm rounded-md bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-white/85 hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                      >
                        <IoChatbubbleEllipsesOutline className="w-4 h-4 inline mr-1" />
                        Message
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamComponent;