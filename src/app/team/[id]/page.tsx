// Shared secureFetch for auto token refresh
'use client';
import { secureFetch } from '@/utils/secureFetch';
import { useEffect, useState } from 'react';
// Task details modal and comment form

import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
// Utility: Refresh access token using refresh token


export default function TeamPage() {
  // Task details modal state
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [taskDetailsLoading, setTaskDetailsLoading] = useState(false);
  const [taskDetailsError, setTaskDetailsError] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [addCommentOpen, setAddCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [addCommentLoading, setAddCommentLoading] = useState(false);
  const [addCommentError, setAddCommentError] = useState<string | null>(null);
  // Fetch task details and comments
  const openTaskDetails = async (taskId: string) => {
    setShowTaskDetails(true);
    setTaskDetailsLoading(true);
    setTaskDetailsError(null);
    setSelectedTask(null);
    setComments([]);
    try {
      const res = await secureFetch(`http://127.0.0.1:8000/api/tasks/${taskId}/`);
      if (!res.ok) {
        setTaskDetailsError('Failed to fetch task details');
        setTaskDetailsLoading(false);
        return;
      }
      const data = await res.json();
      setSelectedTask(data);
      
      // Fetch commenter details for each comment
      const commentsWithDetails = await Promise.all(
        (data.comments || []).map(async (comment: any) => {
          // Check if commenter details are already in memberDetails
          if (memberDetails[comment.commenter]) {
            return { ...comment, commenterName: memberDetails[comment.commenter].name };
          }
          // If not, fetch from API
          try {
            const userRes = await secureFetch(`http://127.0.0.1:8000/api/users/${comment.commenter}/`);
            if (userRes.ok) {
              const userData = await userRes.json();
              return { ...comment, commenterName: userData.name };
            }
          } catch (err) {
            // If fetch fails, use commenter ID as fallback
          }
          return { ...comment, commenterName: comment.commenter };
        })
      );
      
      setComments(commentsWithDetails);
      setTaskDetailsLoading(false);
    } catch (err) {
      setTaskDetailsError('Network error');
      setTaskDetailsLoading(false);
    }
  };

  // Add comment to task
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    setAddCommentLoading(true);
    setAddCommentError(null);
    try {
      const res = await secureFetch(`http://127.0.0.1:8000/api/tasks/${selectedTask.id}/comments/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment: commentText,
        }),
      });
      if (!res.ok) {
        setAddCommentError('Failed to add comment');
        setAddCommentLoading(false);
        return;
      }
      const newComment = await res.json();
      
      // Add commenter name to the new comment
      const commentWithName = {
        ...newComment,
        commenterName: user?.name || memberDetails[newComment.commenter]?.name || newComment.commenter
      };
      
      setComments([...comments, commentWithName]);
      setCommentText('');
      setAddCommentOpen(false);
      setAddCommentLoading(false);
    } catch (err) {
      setAddCommentError('Network error');
      setAddCommentLoading(false);
    }
  };

  const router = useRouter();
  const params = useParams();
  const teamId = params?.id as string;
  const [user, setUser] = useState<any>(null);
  const [team, setTeam] = useState<any>(null);
  const [memberDetails, setMemberDetails] = useState<{[key: string]: any}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskStatus, setTaskStatus] = useState('Pending');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskLoading, setTaskLoading] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [taskSuccess, setTaskSuccess] = useState<string | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateTaskId, setUpdateTaskId] = useState<string | null>(null);
  const [updateTaskStatus, setUpdateTaskStatus] = useState<string | null>(null);
  const [taskStatusFilter, setTaskStatusFilter] = useState('All');
  const [timeline, setTimeline] = useState<any[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);

  // Fetch timeline with polling for live updates
  useEffect(() => {
    if (!teamId || !user?.id || !team?.members?.includes(user?.id)) return;
    
    const fetchTimeline = async () => {
      if (timeline.length === 0) {
        setTimelineLoading(true);
      }
      setTimelineError(null);
      
      try {
        const res = await secureFetch(`http://127.0.0.1:8000/api/teams/${teamId}/timeline/`);
        if (!res.ok) {
          setTimelineError('Failed to fetch timeline');
          setTimelineLoading(false);
          return;
        }
        const data = await res.json();
        setTimeline(data);
        setTimelineLoading(false);
      } catch (err) {
        setTimelineError('Network error');
        setTimelineLoading(false);
      }
    };
    
    // Initial fetch
    fetchTimeline();
    
    // Poll every 10 seconds for live updates
    const pollInterval = setInterval(fetchTimeline, 10000);
    
    // Cleanup interval on unmount or dependency change
    return () => clearInterval(pollInterval);
  }, [teamId, user, team, taskSuccess, updateTaskId]);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) setUser(JSON.parse(userStr));
  }, []);

  useEffect(() => {
    if (!teamId) return;
    const access = localStorage.getItem('access');
    setLoading(true);
    setError(null);
      (async () => {
        let res = await secureFetch(`http://127.0.0.1:8000/api/teams/${teamId}/`);
        if (!res.ok) {
          try {
            const data = await res.json();
            setError(data?.detail || 'Failed to fetch team');
          } catch {
            setError('Failed to fetch team');
          }
          setLoading(false);
          return;
        }
        const data = await res.json();
        setTeam(data);
      
        // Fetch member details for each member ID
        const memberIds = data.members || [];
        const details: {[key: string]: any} = {};
      
        await Promise.all(
          memberIds.map(async (memberId: string) => {
            let userRes = await secureFetch(`http://127.0.0.1:8000/api/users/${memberId}/`);
            if (userRes.ok) {
              const userData = await userRes.json();
              details[memberId] = userData;
            } else {
              details[memberId] = { name: memberId, email: memberId };
            }
          })
        );
        setMemberDetails(details);
        setLoading(false);
      })();
  }, [teamId]);

  // Fetch tasks for the team with polling for live updates
  useEffect(() => {
    if (!teamId) return;
    
    const fetchTasks = async () => {
      // Don't show loading spinner on polling refreshes, only on initial load or filter change
      if (tasks.length === 0) {
        setTasksLoading(true);
      }
      setTasksError(null);
      
      try {
        let url = `http://127.0.0.1:8000/api/tasks/?team=${teamId}`;
        if (taskStatusFilter !== 'All') {
          url += `&status=${encodeURIComponent(taskStatusFilter)}`;
        }
        let res = await secureFetch(url);
        if (!res.ok) {
          setTasksError('Failed to fetch tasks');
          setTasksLoading(false);
          return;
        }
        const data = await res.json();
        setTasks(data);
        setTasksLoading(false);
      } catch (err) {
        setTasksError('Network error');
        setTasksLoading(false);
      }
    };
    
    // Initial fetch
    fetchTasks();
    
    // Poll every 10 seconds for live updates
    const pollInterval = setInterval(fetchTasks, 10000);
    
    // Cleanup interval on unmount or dependency change
    return () => clearInterval(pollInterval);
  }, [teamId, taskSuccess, updateTaskId, taskStatusFilter]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    setInviteSuccess(null);
    setInviteLoading(true);
    try {
      const res = await secureFetch('http://127.0.0.1:8000/api/invitations/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          team: teamId,
          invitee_email: inviteEmail,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setInviteError(data?.detail || 'Failed to send invitation');
        setInviteLoading(false);
        return;
      }
      setInviteSuccess('Invitation sent successfully!');
      setInviteEmail('');
      setInviteLoading(false);
    } catch (err) {
      setInviteError('Network error');
      setInviteLoading(false);
    }
  };

  // Create a new task (admin only)
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaskError(null);
    setTaskSuccess(null);
    setTaskLoading(true);
    try {
      const res = await secureFetch('http://127.0.0.1:8000/api/tasks/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDesc,
          assigned_to: taskAssignee || undefined,
          status: taskStatus,
          team: teamId,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setTaskError(data?.detail || 'Failed to create task');
        setTaskLoading(false);
        return;
      }
      setTaskSuccess('Task created successfully!');
      setTaskTitle('');
      setTaskDesc('');
      setTaskStatus('Pending');
      setTaskAssignee('');
      setShowTaskModal(false);
      setTaskLoading(false);
    } catch (err) {
      setTaskError('Network error');
      setTaskLoading(false);
    }
  };

  // Update task status (any member)
  const handleUpdateTask = async (taskId: string, newStatus: string) => {
    setUpdateLoading(true);
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) throw new Error('Task not found');
      const res = await secureFetch(`http://127.0.0.1:8000/api/tasks/${taskId}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...task,
          status: newStatus,
        }),
      });
      if (res.ok) {
        setUpdateTaskId(taskId);
        setUpdateTaskStatus(newStatus);
      }
      setUpdateLoading(false);
    } catch (err) {
      setUpdateLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;
  if (!team) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800">
      <div className="relative flex flex-row w-full max-w-6xl min-h-[600px] bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
        {/* Main content left */}
        <div className="flex-1 p-8 text-center">
          <button
            onClick={() => router.back()}
            className="absolute left-4 top-4 px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            &larr; Back
          </button>
          {/* Show invite button only for admins */}
          {user?.role === 'Admin' && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="absolute right-4 top-4 px-3 py-1 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Invite Member
            </button>
          )}
          {/* Invite modal */}
          {showInviteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md relative">
                <button
                  className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  onClick={() => { setShowInviteModal(false); setInviteError(null); setInviteSuccess(null); }}
                  aria-label="Close"
                >
                  &times;
                </button>
                <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Invite Member</h3>
                <form onSubmit={handleInvite} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Invitee Email</label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  {inviteError && <div className="text-red-600 dark:text-red-400 text-sm">{inviteError}</div>}
                  {inviteSuccess && <div className="text-green-600 dark:text-green-400 text-sm">{inviteSuccess}</div>}
                  <button
                    type="submit"
                    disabled={inviteLoading}
                    className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {inviteLoading ? 'Inviting...' : 'Send Invitation'}
                  </button>
                </form>
              </div>
            </div>
          )}
          {/* Show create task button only for admins */}
          {user?.role === 'Admin' && (
            <button
              onClick={() => setShowTaskModal(true)}
              className="absolute right-32 top-4 px-3 py-1 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Create Task
            </button>
          )}
          {/* Create Task Modal */}
          {showTaskModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md relative">
                <button
                  className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  onClick={() => { setShowTaskModal(false); setTaskError(null); setTaskSuccess(null); }}
                  aria-label="Close"
                >
                  &times;
                </button>
                <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Create Task</h3>
                <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                  <input
                    type="text"
                    value={taskTitle}
                    onChange={e => setTaskTitle(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea
                    value={taskDesc}
                    onChange={e => setTaskDesc(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assign to</label>
                  <select
                    value={taskAssignee}
                    onChange={e => setTaskAssignee(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select member (optional)</option>
                    {Object.entries(memberDetails).map(([id, member]) => (
                      <option key={id} value={id}>{member?.name || id}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <select
                    value={taskStatus}
                    onChange={e => setTaskStatus(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
                {taskError && <div className="text-red-600 dark:text-red-400 text-sm">{taskError}</div>}
                {taskSuccess && <div className="text-green-600 dark:text-green-400 text-sm">{taskSuccess}</div>}
                <button
                  type="submit"
                  disabled={taskLoading}
                  className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {taskLoading ? 'Creating...' : 'Create Task'}
                </button>
              </form>
            </div>
          </div>
        )}
          <h1 className="text-3xl font-bold mb-4 text-indigo-700 dark:text-indigo-300">{team.name}</h1>
          <p className="mb-2 text-lg text-gray-700 dark:text-gray-300">{team.description}</p>
          <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">Created by: {team.created_by}</div>
          <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">Created at: {new Date(team.created_at).toLocaleString()}</div>
          <div className="mb-2 text-md font-semibold text-indigo-600 dark:text-indigo-400">Members:</div>
          <ul className="list-none space-y-2 text-gray-800 dark:text-gray-100">
            {team.members.map((memberId: string) => {
              const member = memberDetails[memberId];
              return (
                <li key={memberId} className="bg-gray-50 dark:bg-gray-700 px-4 py-2 rounded-lg">
                  <div className="font-semibold">{member?.name || 'Loading...'}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{member?.email || memberId}</div>
                </li>
              );
            })}
          </ul>
          {/* Timeline Section - visible to team members only */}
          {team.members.includes(user?.id) && (
            <div className="mt-8 text-left">
              <h2 className="text-xl font-bold mb-4 text-blue-700 dark:text-blue-300">Activity Timeline</h2>
              {timelineLoading && <div className="text-xs text-gray-500 dark:text-gray-400">Loading timeline...</div>}
              {timelineError && <div className="text-red-600 dark:text-red-400 mb-2">{timelineError}</div>}
              <ul className="flex flex-col gap-4">
                {timeline.map((entry, idx) => (
                  <li key={idx} className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg shadow-md">
                    <div className="font-semibold text-blue-800 dark:text-blue-200">{entry.message}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{new Date(entry.timestamp).toLocaleString()}</div>
                  </li>
                ))}
                {(!timelineLoading && timeline.length === 0) && (
                  <li className="text-center text-gray-500 dark:text-gray-400">No activity yet.</li>
                )}
              </ul>
            </div>
          )}
        </div>
        {/* Tasks sidebar right */}
        <div className="w-[400px] min-w-[300px] max-w-[500px] h-full border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-6 overflow-y-auto flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-green-700 dark:text-green-300">Team Tasks</h2>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filter by Status</label>
            <select
              value={taskStatusFilter}
              onChange={e => setTaskStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="All">All</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>
          </div>
          {tasksLoading && <div className="text-xs text-gray-500 dark:text-gray-400">Loading tasks...</div>}
          {tasksError && <div className="text-red-600 dark:text-red-400 mb-2">{tasksError}</div>}
          <ul className="flex flex-col gap-4 w-full">
            {tasks.map(task => {
              return (
                <li key={task.id} className="bg-green-50 dark:bg-green-900 p-4 rounded-lg shadow-md flex flex-col gap-2">
                  <div>
                    <div className="font-semibold text-lg text-green-800 dark:text-green-200">{task.title}</div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">{task.description}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Assigned to: {memberDetails[task.assigned_to]?.name || 'Unassigned'}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Status: <span className="font-bold">{task.status}</span></div>
                  </div>
                  <div className="flex flex-row gap-2 items-center">
                    <select
                      value={task.status}
                      onChange={e => handleUpdateTask(task.id, e.target.value)}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
                      disabled={updateLoading}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Done">Done</option>
                    </select>
                    <button
                      className="ml-2 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                      onClick={() => openTaskDetails(task.id)}
                    >
                      View Details
                    </button>
                  </div>
                </li>
              );
            })}
            {(!tasksLoading && tasks.length === 0) && (
              <li className="text-center text-gray-500 dark:text-gray-400">No tasks for this team yet.</li>
            )}
          </ul>

          {/* Task Details Modal */}
          {showTaskDetails && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg relative">
                <button
                  className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  onClick={() => { setShowTaskDetails(false); setSelectedTask(null); setComments([]); setAddCommentOpen(false); setAddCommentError(null); }}
                  aria-label="Close"
                >
                  &times;
                </button>
                {taskDetailsLoading ? (
                  <div className="text-center text-gray-500 dark:text-gray-400">Loading...</div>
                ) : taskDetailsError ? (
                  <div className="text-red-600 dark:text-red-400 mb-2">{taskDetailsError}</div>
                ) : selectedTask && (
                  <>
                    <h3 className="text-xl font-bold mb-2 text-green-700 dark:text-green-300">{selectedTask.title}</h3>
                    <div className="mb-2 text-gray-700 dark:text-gray-300">{selectedTask.description}</div>
                    <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">Assigned to: {memberDetails[selectedTask.assigned_to]?.name || 'Unassigned'}</div>
                    <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">Status: <span className="font-bold">{selectedTask.status}</span></div>
                    <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">Created: {new Date(selectedTask.created_at).toLocaleString()}</div>
                    <div className="mb-4 text-xs text-gray-500 dark:text-gray-400">Last updated: {new Date(selectedTask.updated_at).toLocaleString()}</div>
                    <h4 className="font-semibold mb-2 text-indigo-700 dark:text-indigo-300">Comments</h4>
                    <ul className="mb-2 max-h-40 overflow-y-auto flex flex-col gap-2">
                      {comments.length === 0 && <li className="text-gray-500 dark:text-gray-400 text-sm">No comments yet.</li>}
                      {comments.map((c, idx) => (
                        <li key={idx} className="bg-gray-100 dark:bg-gray-700 p-2 rounded">
                          <div className="text-sm text-gray-900 dark:text-gray-100">{c.comment}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">By: {c.commenter_name || (c.user && (c.user.name || c.user.full_name || c.user.email)) || c.user_email || 'Unknown'} &middot; {new Date(c.timestamp).toLocaleString()}</div>
                        </li>
                      ))}
                    </ul>
                    {addCommentOpen ? (
                      <form onSubmit={handleAddComment} className="flex flex-col gap-2 mt-2">
                        <textarea
                          value={commentText}
                          onChange={e => setCommentText(e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
                          placeholder="Write your comment..."
                        />
                        {addCommentError && <div className="text-red-600 dark:text-red-400 text-xs">{addCommentError}</div>}
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={addCommentLoading}
                            className="py-1 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 text-sm"
                          >
                            {addCommentLoading ? 'Adding...' : 'Add Comment'}
                          </button>
                          <button
                            type="button"
                            className="py-1 px-4 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-medium transition-colors text-sm"
                            onClick={() => { setAddCommentOpen(false); setAddCommentError(null); }}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        className="mt-2 py-1 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
                        onClick={() => setAddCommentOpen(true)}
                      >
                        Add Comment
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Task Details Modal */}
          {showTaskDetails && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg relative">
                <button
                  className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  onClick={() => { setShowTaskDetails(false); setSelectedTask(null); setComments([]); setAddCommentOpen(false); setAddCommentError(null); }}
                  aria-label="Close"
                >
                  &times;
                </button>
                {taskDetailsLoading ? (
                  <div className="text-center text-gray-500 dark:text-gray-400">Loading...</div>
                ) : taskDetailsError ? (
                  <div className="text-red-600 dark:text-red-400 mb-2">{taskDetailsError}</div>
                ) : selectedTask && (
                  <>
                    <h3 className="text-xl font-bold mb-2 text-green-700 dark:text-green-300">{selectedTask.title}</h3>
                    <div className="mb-2 text-gray-700 dark:text-gray-300">{selectedTask.description}</div>
                    <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">Assigned to: {memberDetails[selectedTask.assigned_to]?.name || 'Unassigned'}</div>
                    <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">Status: <span className="font-bold">{selectedTask.status}</span></div>
                    <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">Created: {new Date(selectedTask.created_at).toLocaleString()}</div>
                    <div className="mb-4 text-xs text-gray-500 dark:text-gray-400">Last updated: {new Date(selectedTask.updated_at).toLocaleString()}</div>
                    <h4 className="font-semibold mb-2 text-indigo-700 dark:text-indigo-300">Comments</h4>
                    <ul className="mb-2 max-h-40 overflow-y-auto flex flex-col gap-2">
                      {comments.length === 0 && <li className="text-gray-500 dark:text-gray-400 text-sm">No comments yet.</li>}
                      {comments.map((c, idx) => (
                        <li key={idx} className="bg-gray-100 dark:bg-gray-700 p-2 rounded">
                          <div className="text-sm text-gray-900 dark:text-gray-100">{c.comment}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">By: {memberDetails[c.commenter]?.name || c.commenter || 'User'} &middot; {new Date(c.timestamp).toLocaleString()}</div>
                        </li>
                      ))}
                    </ul>
                    {addCommentOpen ? (
                      <form onSubmit={handleAddComment} className="flex flex-col gap-2 mt-2">
                        <textarea
                          value={commentText}
                          onChange={e => setCommentText(e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
                          placeholder="Write your comment..."
                        />
                        {addCommentError && <div className="text-red-600 dark:text-red-400 text-xs">{addCommentError}</div>}
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={addCommentLoading}
                            className="py-1 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 text-sm"
                          >
                            {addCommentLoading ? 'Adding...' : 'Add Comment'}
                          </button>
                          <button
                            type="button"
                            className="py-1 px-4 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-medium transition-colors text-sm"
                            onClick={() => { setAddCommentOpen(false); setAddCommentError(null); }}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        className="mt-2 py-1 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
                        onClick={() => setAddCommentOpen(true)}
                      >
                        Add Comment
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Task Details Modal */}
          {showTaskDetails && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg relative">
                <button
                  className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  onClick={() => { setShowTaskDetails(false); setSelectedTask(null); setComments([]); setAddCommentOpen(false); setAddCommentError(null); }}
                  aria-label="Close"
                >
                  &times;
                </button>
                {taskDetailsLoading ? (
                  <div className="text-center text-gray-500 dark:text-gray-400">Loading...</div>
                ) : taskDetailsError ? (
                  <div className="text-red-600 dark:text-red-400 mb-2">{taskDetailsError}</div>
                ) : selectedTask && (
                  <>
                    <h3 className="text-xl font-bold mb-2 text-green-700 dark:text-green-300">{selectedTask.title}</h3>
                    <div className="mb-2 text-gray-700 dark:text-gray-300">{selectedTask.description}</div>
                    <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">Assigned to: {memberDetails[selectedTask.assigned_to]?.name || 'Unassigned'}</div>
                    <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">Status: <span className="font-bold">{selectedTask.status}</span></div>
                    <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">Created: {new Date(selectedTask.created_at).toLocaleString()}</div>
                    <div className="mb-4 text-xs text-gray-500 dark:text-gray-400">Last updated: {new Date(selectedTask.updated_at).toLocaleString()}</div>
                    <h4 className="font-semibold mb-2 text-indigo-700 dark:text-indigo-300">Comments</h4>
                    <ul className="mb-2 max-h-40 overflow-y-auto flex flex-col gap-2">
                      {comments.length === 0 && <li className="text-gray-500 dark:text-gray-400 text-sm">No comments yet.</li>}
                      {comments.map((c, idx) => (
                        <li key={idx} className="bg-gray-100 dark:bg-gray-700 p-2 rounded">
                          <div className="text-sm text-gray-900 dark:text-gray-100">{c.comment}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">By: {c.commenterName || 'User'} &middot; {new Date(c.timestamp).toLocaleString()}</div>
                        </li>
                      ))}
                    </ul>
                    {addCommentOpen ? (
                      <form onSubmit={handleAddComment} className="flex flex-col gap-2 mt-2">
                        <textarea
                          value={commentText}
                          onChange={e => setCommentText(e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
                          placeholder="Write your comment..."
                        />
                        {addCommentError && <div className="text-red-600 dark:text-red-400 text-xs">{addCommentError}</div>}
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={addCommentLoading}
                            className="py-1 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 text-sm"
                          >
                            {addCommentLoading ? 'Adding...' : 'Add Comment'}
                          </button>
                          <button
                            type="button"
                            className="py-1 px-4 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-medium transition-colors text-sm"
                            onClick={() => { setAddCommentOpen(false); setAddCommentError(null); }}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        className="mt-2 py-1 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
                        onClick={() => setAddCommentOpen(true)}
                      >
                        Add Comment
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
           
        </div>
      </div>
    </div>
  );
}
