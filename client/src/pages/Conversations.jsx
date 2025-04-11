import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { conversationService } from '../services/api';

const Conversations = () => {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchConversations = async () => {
      if (!currentUser?.id) return;
      
      try {
        setLoading(true);
        const response = await conversationService.getConversationsByCandidate(currentUser.id);
        setConversations(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching conversations:', err);
        setError('Failed to load conversation history');
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [currentUser]);

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Conversation History
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : conversations.length > 0 ? (
          <List>
            {conversations.map((conversation) => (
              <Box key={conversation.id}>
                <ListItem alignItems="flex-start">
                  <ListItemText
                    primary={
                      <Typography
                        component="span"
                        variant="body1"
                        color={conversation.sender === 'agent' ? 'primary' : 'text.primary'}
                        fontWeight={conversation.sender === 'agent' ? 'bold' : 'normal'}
                      >
                        {conversation.sender === 'agent' ? 'AI Agent' : 'You'}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography component="span" variant="body2" sx={{ display: 'block' }}>
                          {conversation.message}
                        </Typography>
                        <Typography component="span" variant="caption" color="text.secondary">
                          {formatTimestamp(conversation.timestamp || conversation.createdAt)}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                <Divider />
              </Box>
            ))}
          </List>
        ) : (
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No conversations found. Start talking with the Voice Agent to see your conversation history here.
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default Conversations;