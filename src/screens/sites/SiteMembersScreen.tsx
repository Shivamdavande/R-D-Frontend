import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, TouchableOpacity } from 'react-native';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import api from '../../services/api';

export const SiteMembersScreen = ({ route, navigation }: any) => {
  const { siteId } = route.params;
  const [members, setMembers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMembers();
    loadAllUsers();
  }, [siteId]);

  const loadMembers = async () => {
    try {
      const res = await api.get(`/sites/${siteId}/members`);
      if (res.data?.success) setMembers(res.data.members);
    } catch (e) {
      console.log('Error loading members:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadAllUsers = async () => {
    try {
      const res = await api.get('/users');
      if (res.data?.success) setAllUsers(res.data.users);
    } catch (e) {
      console.log('Error loading all users:', e);
    }
  };

  const handleAddMember = async (userId: string, userName: string) => {
    try {
      const res = await api.post(`/sites/${siteId}/members`, { userId, role: 'SUPERVISOR' });
      if (res.data?.success) {
        Alert.alert('Success ✅', `${userName} assigned as site supervisor.`);
        loadMembers();
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleRemoveMember = async (userId: string, userName: string) => {
    Alert.alert('Remove Collaborator', `Remove ${userName} from this site?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await api.delete(`/sites/${siteId}/members/${userId}`);
            if (res.data?.success) {
              loadMembers();
            }
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        }
      }
    ]);
  };

  const memberUserIds = members.map(m => m.userId?._id || m.userId);

  return (
    <View style={styles.container}>
      <Header title="Manage Site Collaborators" subtitle="Assign supervisors to site" navigation={navigation} showSiteSelector={false} />

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>CURRENT ASSIGNED MEMBERS ({members.length})</Text>
        <FlatList
          data={members}
          keyExtractor={(item) => item._id}
          style={{ maxHeight: 200, marginBottom: 16 }}
          renderItem={({ item }) => {
            const usr = item.userId || {};
            return (
              <Card style={styles.memberCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nameText}>{usr.name || 'User'}</Text>
                  <Text style={styles.emailText}>{usr.email}</Text>
                </View>
                <Badge label={item.role} variant={item.role === 'OWNER' ? 'warning' : 'info'} />
                {item.role !== 'OWNER' && (
                  <TouchableOpacity onPress={() => handleRemoveMember(usr._id, usr.name)} style={{ marginLeft: 10 }}>
                    <Text style={{ color: Colors.danger, fontSize: 16 }}>🗑️</Text>
                  </TouchableOpacity>
                )}
              </Card>
            );
          }}
        />

        <Text style={styles.sectionTitle}>ADD SUPERVISOR COLLABORATOR</Text>
        <FlatList
          data={allUsers.filter(u => !memberUserIds.includes(u._id))}
          keyExtractor={(item) => item._id}
          ListEmptyComponent={<Text style={{ color: Colors.textMuted, fontSize: 12 }}>All available users are already assigned to this site.</Text>}
          renderItem={({ item }) => (
            <Card style={styles.userCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.nameText}>{item.name}</Text>
                <Text style={styles.emailText}>{item.email} • {item.role}</Text>
              </View>
              <Button title="+ Assign" onPress={() => handleAddMember(item._id, item.name)} size="small" />
            </Card>
          )}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, padding: 14 },
  sectionTitle: { color: Colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' },
  memberCard: { flexDirection: 'row', alignItems: 'center', padding: 10, marginBottom: 6 },
  userCard: { flexDirection: 'row', alignItems: 'center', padding: 10, marginBottom: 6 },
  nameText: { color: Colors.textPrimary, fontSize: 13, fontWeight: '700' },
  emailText: { color: Colors.textSecondary, fontSize: 11, marginTop: 2 }
});
