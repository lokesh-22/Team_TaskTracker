'use client';

import { useCallback, useEffect, useState } from 'react';
import { secureFetch } from '@/utils/secureFetch';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [teams, setTeams] = useState<any[]>([]);
  const [memberTeams, setMemberTeams] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [memberTeamsLoading, setMemberTeamsLoading] = useState(false);
  const [invitationsLoading, setInvitationsLoading] = useState(false);
  const [teamsError, setTeamsError] = useState<string | null>(null);
  const [memberTeamsError, setMemberTeamsError] = useState<string | null>(null);
  const [invitationsError, setInvitationsError] = useState<string | null>(null);

  const fetchTeams = useCallback(async (userId: string, silent = false) => {
    if (!silent) setTeamsLoading(true);
    setTeamsError(null);
    try {
      const res = await secureFetch(`http://127.0.0.1:8000/api/teams/?created_by=${userId}`);
      if (!res.ok) {
        setTeamsError('Failed to fetch teams');
        setTeamsLoading(false);
        return;
      }
      const data = await res.json();
      setTeams(data);
      setTeamsLoading(false);
    } catch (err) {
      setTeamsError('Network error');
      setTeamsLoading(false);
    }
  }, []);

  const fetchMemberTeams = useCallback(async (userId: string, silent = false) => {
    if (!silent) setMemberTeamsLoading(true);
    setMemberTeamsError(null);
    try {
      const res = await secureFetch(`http://127.0.0.1:8000/api/teams/?member=${userId}`);
      if (!res.ok) {
        setMemberTeamsError('Failed to fetch teams');
        setMemberTeamsLoading(false);
        return;
      }
      const data = await res.json();
      setMemberTeams(data);
      setMemberTeamsLoading(false);
    } catch (err) {
      setMemberTeamsError('Network error');
      setMemberTeamsLoading(false);
    }
  }, []);

  const fetchInvitations = useCallback(async (silent = false) => {
    if (!silent) setInvitationsLoading(true);
    setInvitationsError(null);
    try {
      const res = await secureFetch('http://127.0.0.1:8000/api/invitations/');
      if (!res.ok) {
        setInvitationsError('Failed to fetch invitations');
        setInvitationsLoading(false);
        return;
      }
      const data = await res.json();
      setInvitations(data);
      setInvitationsLoading(false);
    } catch (err) {
      setInvitationsError('Network error');
      setInvitationsLoading(false);
    }
  }, []);

  const respondInvitation = async (invitationId: string, action: 'accept' | 'reject') => {
    try {
      const res = await secureFetch(`http://127.0.0.1:8000/api/invitations/${invitationId}/respond/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        fetchInvitations(); 
        if (role === 'Member' && user?.id) fetchMemberTeams(user.id); 
      }
    } catch (err) {
      // optionally handle error
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.replace('/login');
      return;
    }
    const userObj = JSON.parse(userStr);
    setUser(userObj);
    setRole(userObj.role);
    
    // Initial fetch
    if (userObj.role === 'Admin') {
      fetchTeams(userObj.id);
    } else if (userObj.role === 'Member') {
      fetchMemberTeams(userObj.id);
      fetchInvitations();
    }
    
    // Set up polling for live updates every 15 seconds
    const pollInterval = setInterval(() => {
      if (userObj.role === 'Admin') {
        fetchTeams(userObj.id, true); // silent refresh (no loading spinner)
      } else if (userObj.role === 'Member') {
        fetchMemberTeams(userObj.id, true); // silent refresh
        fetchInvitations(true); // silent refresh
      }
    }, 15000);
    
    // Cleanup interval on unmount
    return () => clearInterval(pollInterval);
  }, [router, fetchTeams, fetchMemberTeams, fetchInvitations]);

  const handleLogout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    router.replace('/login');
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);
    try {
      const res = await secureFetch('http://127.0.0.1:8000/api/teams/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: teamName,
          description: teamDesc,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setFormError(data?.detail || 'Failed to create team');
        setFormLoading(false);
        return;
      }
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        fetchTeams(userObj.id);
      }
      setShowModal(false);
      setTeamName('');
      setTeamDesc('');
      setFormLoading(false);
    } catch (err) {
      setFormError('Network error');
      setFormLoading(false);
    }
  };

  if (!role) {
    return <div className="min-h-screen flex items-center justify-center text-xl font-medium text-gray-700 dark:text-gray-300">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 dark:from-gray-900 dark:to-gray-800 flex flex-col font-sans">
      {/* Top bar */}
      <div className="flex justify-between items-center px-8 py-4 bg-white dark:bg-gray-900 shadow-lg border-b border-gray-200 dark:border-gray-700">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome, <span className="font-semibold text-purple-600 dark:text-purple-400">{user?.name}</span>!
        </div>
        <button
          onClick={handleLogout}
          className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold shadow transition-all"
        >
          Logout
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-start pt-12">
        <div className="w-full max-w-3xl px-4">
          <div className="mb-6 text-right text-md text-gray-600 dark:text-gray-400">
            Role: <span className="font-bold text-purple-700 dark:text-purple-300">{role}</span>
          </div>

          {/* Admin Section */}
          {role === 'Admin' && (
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-semibold mb-4 text-purple-700 dark:text-purple-300 flex items-center gap-2">
                Your Teams
                {teamsLoading && <span className="text-sm text-gray-400 dark:text-gray-500">Loading...</span>}
              </h2>
              {teamsError && <div className="text-red-600 dark:text-red-400 mb-3">{teamsError}</div>}
              <ul className="flex flex-col gap-3 mb-4">
                {teams.map(team => (
                  <li key={team.id}>
                    <Link
                      href={`/team/${team.id}`}
                      className="block px-5 py-3 rounded-lg bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200 font-medium shadow hover:scale-105 transition-transform cursor-pointer"
                    >
                      {team.name}
                    </Link>
                  </li>
                ))}
                {!teamsLoading && teams.length === 0 && (
                  <li className="text-center text-gray-500 dark:text-gray-400 py-3">No teams created yet.</li>
                )}
              </ul>
              <button
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold shadow transition-all"
                onClick={() => setShowModal(true)}
              >
                + Create New Team
              </button>

              {/* Modal */}
              {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-md relative">
                    <button
                      className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl"
                      onClick={() => setShowModal(false)}
                      aria-label="Close"
                    >
                      &times;
                    </button>
                    <h3 className="text-xl font-bold mb-5 text-gray-900 dark:text-white">Create New Team</h3>
                    <form onSubmit={handleCreateTeam} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Team Name</label>
                        <input
                          type="text"
                          value={teamName}
                          onChange={e => setTeamName(e.target.value)}
                          required
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                        <textarea
                          value={teamDesc}
                          onChange={e => setTeamDesc(e.target.value)}
                          required
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      {formError && <div className="text-red-600 dark:text-red-400 text-sm">{formError}</div>}
                      <button
                        type="submit"
                        disabled={formLoading}
                        className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold shadow transition-all disabled:opacity-50"
                      >
                        {formLoading ? 'Creating...' : 'Create Team'}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Member Section */}
          {role === 'Member' && (
            <div className="space-y-6">
              {/* Teams */}
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-semibold mb-4 text-green-700 dark:text-green-300">Your Teams</h2>
                {memberTeamsLoading && <div className="text-sm text-gray-400 dark:text-gray-500">Loading teams...</div>}
                {memberTeamsError && <div className="text-red-600 dark:text-red-400 mb-3">{memberTeamsError}</div>}
                <ul className="flex flex-col gap-3">
                  {memberTeams.map(team => (
                    <li key={team.id}>
                      <Link
                        href={`/team/${team.id}`}
                        className="block px-5 py-3 rounded-lg bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 font-medium shadow hover:scale-105 transition-transform cursor-pointer"
                      >
                        {team.name}
                      </Link>
                    </li>
                  ))}
                  {!memberTeamsLoading && memberTeams.length === 0 && (
                    <li className="text-center text-gray-500 dark:text-gray-400 py-3">You are not a member of any teams.</li>
                  )}
                </ul>
              </div>

              {/* Invitations */}
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-semibold mb-4 text-yellow-700 dark:text-yellow-300">Your Invitations</h2>
                {invitationsLoading && <div className="text-sm text-gray-400 dark:text-gray-500">Loading invitations...</div>}
                {invitationsError && <div className="text-red-600 dark:text-red-400 mb-3">{invitationsError}</div>}
                <ul className="flex flex-col gap-3">
                  {invitations.filter(inv => inv.status === 'Pending').map(inv => (
                    <li
                      key={inv.id}
                      className="px-5 py-3 rounded-lg bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 shadow flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                    >
                      <div className="flex flex-col md:flex-row md:gap-4">
                        <span>Team: <span className="font-semibold">{inv.team_name || inv.team}</span></span>
                        <span>Invited by: {inv.inviter_email || inv.inviter}</span>
                      </div>
                      <div className="flex gap-3 mt-2 md:mt-0">
                        <button
                          onClick={() => respondInvitation(inv.id, 'accept')}
                          className="px-4 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => respondInvitation(inv.id, 'reject')}
                          className="px-4 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all"
                        >
                          Reject
                        </button>
                      </div>
                    </li>
                  ))}
                  {!invitationsLoading && invitations.filter(inv => inv.status === 'Pending').length === 0 && (
                    <li className="text-center text-gray-500 dark:text-gray-400 py-3">No pending invitations.</li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
