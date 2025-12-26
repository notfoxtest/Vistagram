import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { Crown } from 'lucide-react';

export const MemberList = () => {
  const { members, currentServer, createDM, setCurrentDM, setCurrentServer, setCurrentChannel } = useApp();

  // Group members by status
  const onlineMembers = members.filter(m => m.status === 'online');
  const offlineMembers = members.filter(m => m.status !== 'online');

  const handleMemberClick = async (member) => {
    try {
      const dm = await createDM(member.id);
      setCurrentServer(null);
      setCurrentChannel(null);
      setCurrentDM(dm);
    } catch (error) {
      console.error('Failed to create DM:', error);
    }
  };

  const isOwner = (memberId) => currentServer?.owner_id === memberId;

  return (
    <div className="member-list" data-testid="member-list">
      {/* Online Members */}
      {onlineMembers.length > 0 && (
        <div className="member-section">
          <h4 className="member-section-title">Online — {onlineMembers.length}</h4>
          {onlineMembers.map((member) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="member-item group"
              onClick={() => handleMemberClick(member)}
              data-testid={`member-${member.id}`}
            >
              <div className="member-avatar">
                <img 
                  src={member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.username}`} 
                  alt={member.username} 
                />
                <div className={`member-status status-${member.status}`} />
              </div>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="member-name truncate">{member.username}</span>
                {isOwner(member.id) && (
                  <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                )}
                {member.is_nitro && (
                  <span className="nitro-badge text-[8px] py-0.5">NITRO</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Offline Members */}
      {offlineMembers.length > 0 && (
        <div className="member-section">
          <h4 className="member-section-title">Offline — {offlineMembers.length}</h4>
          {offlineMembers.map((member) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="member-item group opacity-50"
              onClick={() => handleMemberClick(member)}
              data-testid={`member-${member.id}`}
            >
              <div className="member-avatar">
                <img 
                  src={member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.username}`} 
                  alt={member.username} 
                />
                <div className={`member-status status-offline`} />
              </div>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="member-name truncate">{member.username}</span>
                {isOwner(member.id) && (
                  <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MemberList;
