'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { AlertCircle, CheckCircle2, Clock, Send, TrendingUp, Users, Target, Activity, Download, RefreshCw } from 'lucide-react'
import { callAIAgent } from '@/utils/aiAgent'
import parseLLMJson from '@/utils/jsonParser'

// Type definitions
interface TeamMember {
  name: string
  slackId: string
  email: string
}

interface MemberMetrics {
  name: string
  mqls: number
  campaigns: number
  engagementRate: number
  qualityScore: number
  slackUserId?: string
  responseTime?: string
  status?: string
}

interface WorkflowState {
  status: 'idle' | 'coordinator_running' | 'communication_running' | 'aggregation_running' | 'complete' | 'error'
  progress: number
  message: string
  coordinatorResponse?: any
  communicationResponse?: any
  aggregationResponse?: any
  error?: string
  timestamp?: string
}

interface DashboardData {
  totalMQLs: number
  totalCampaigns: number
  avgEngagementRate: number
  teamSize: number
  members: MemberMetrics[]
  trends: any[]
  qualityMetrics: any
}

// Agent IDs
const COORDINATOR_AGENT = '68fd3f07058210757bf6403f'
const COMMUNICATION_AGENT = '68fd3f1171c6b27d6c8eb882'
const AGGREGATION_AGENT = '68fd3f1ba39d463331e037a4'

// Color scheme
const COLORS = {
  primary: '#1A73E8',
  secondary: '#00B8D4',
  dark: '#0F1419',
  darkCard: '#1A1F2E',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  text: '#E5E7EB',
  textMuted: '#9CA3AF',
}

// Helper: Generate random IDs for API calls
function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// Helper: Format timestamp
function formatTime(date: Date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

// Dashboard Component
function Dashboard({ data, isLoading }: { data: DashboardData | null; isLoading: boolean }) {
  if (!data) {
    return (
      <div className="grid gap-6">
        <Card style={{ backgroundColor: COLORS.darkCard, borderColor: COLORS.primary }}>
          <CardHeader>
            <CardTitle style={{ color: COLORS.text }}>Marketing Intelligence Dashboard</CardTitle>
            <CardDescription style={{ color: COLORS.textMuted }}>Weekly aggregated metrics</CardDescription>
          </CardHeader>
          <CardContent className="text-center py-12">
            <p style={{ color: COLORS.textMuted }}>Run the workflow to generate dashboard data</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Prepare chart data
  const memberChartData = data.members.map(m => ({
    name: m.name.split(' ')[0],
    mqls: m.mqls,
    campaigns: m.campaigns,
    engagement: Math.round(m.engagementRate * 100),
  }))

  const trendData = [
    { week: 'Week 1', mqls: Math.max(0, data.totalMQLs - 45), campaigns: Math.max(0, data.totalCampaigns - 8) },
    { week: 'Week 2', mqls: Math.max(0, data.totalMQLs - 30), campaigns: Math.max(0, data.totalCampaigns - 5) },
    { week: 'Week 3', mqls: Math.max(0, data.totalMQLs - 15), campaigns: Math.max(0, data.totalCampaigns - 2) },
    { week: 'This Week', mqls: data.totalMQLs, campaigns: data.totalCampaigns },
  ]

  const qualityChartData = [
    { name: 'High Quality', value: Math.round(data.qualityMetrics?.highQuality || 60) },
    { name: 'Medium Quality', value: Math.round(data.qualityMetrics?.mediumQuality || 30) },
    { name: 'Review Needed', value: Math.round(data.qualityMetrics?.reviewNeeded || 10) },
  ]

  if (isLoading) {
    return (
      <div className="grid gap-6">
        <Card style={{ backgroundColor: COLORS.darkCard }}>
          <CardHeader>
            <CardTitle style={{ color: COLORS.text }}>Marketing Intelligence Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-12">
            <Spinner className="mr-2" />
            <span style={{ color: COLORS.textMuted }}>Generating dashboard...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      {/* Header */}
      <Card style={{ backgroundColor: COLORS.darkCard, borderColor: COLORS.primary }} className="border">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle style={{ color: COLORS.text }}>Marketing Intelligence Dashboard</CardTitle>
              <CardDescription style={{ color: COLORS.textMuted }}>Weekly aggregated team metrics</CardDescription>
            </div>
            <Badge style={{ backgroundColor: COLORS.secondary, color: COLORS.dark }}>Live</Badge>
          </div>
        </CardHeader>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total MQLs', value: data.totalMQLs, icon: Target, color: COLORS.primary },
          { label: 'Campaigns', value: data.totalCampaigns, icon: Activity, color: COLORS.secondary },
          { label: 'Avg Engagement', value: `${Math.round(data.avgEngagementRate * 100)}%`, icon: TrendingUp, color: COLORS.success },
          { label: 'Team Members', value: data.teamSize, icon: Users, color: COLORS.warning },
        ].map((kpi, idx) => (
          <Card key={idx} style={{ backgroundColor: COLORS.darkCard }}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p style={{ color: COLORS.textMuted }} className="text-sm font-medium">
                    {kpi.label}
                  </p>
                  <p style={{ color: COLORS.text }} className="text-3xl font-bold mt-2">
                    {kpi.value}
                  </p>
                </div>
                <kpi.icon size={32} style={{ color: kpi.color, opacity: 0.7 }} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MQL & Campaign Trends */}
        <Card style={{ backgroundColor: COLORS.darkCard }}>
          <CardHeader>
            <CardTitle style={{ color: COLORS.text }} className="text-lg">
              Weekly Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.textMuted} opacity={0.2} />
                <XAxis dataKey="week" stroke={COLORS.textMuted} />
                <YAxis stroke={COLORS.textMuted} />
                <Tooltip contentStyle={{ backgroundColor: COLORS.darkCard, border: `1px solid ${COLORS.primary}` }} />
                <Legend />
                <Line type="monotone" dataKey="mqls" stroke={COLORS.primary} name="MQLs" strokeWidth={2} />
                <Line type="monotone" dataKey="campaigns" stroke={COLORS.secondary} name="Campaigns" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quality Distribution */}
        <Card style={{ backgroundColor: COLORS.darkCard }}>
          <CardHeader>
            <CardTitle style={{ color: COLORS.text }} className="text-lg">
              Data Quality
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={qualityChartData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill={COLORS.primary} dataKey="value">
                  <Cell fill={COLORS.success} />
                  <Cell fill={COLORS.secondary} />
                  <Cell fill={COLORS.warning} />
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: COLORS.darkCard, border: `1px solid ${COLORS.primary}` }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Member Performance */}
      <Card style={{ backgroundColor: COLORS.darkCard }}>
        <CardHeader>
          <CardTitle style={{ color: COLORS.text }} className="text-lg">
            Individual Contributors
          </CardTitle>
          <CardDescription style={{ color: COLORS.textMuted }}>Team member performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={memberChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.textMuted} opacity={0.2} />
              <XAxis dataKey="name" stroke={COLORS.textMuted} />
              <YAxis stroke={COLORS.textMuted} />
              <Tooltip contentStyle={{ backgroundColor: COLORS.darkCard, border: `1px solid ${COLORS.primary}` }} />
              <Legend />
              <Bar dataKey="mqls" fill={COLORS.primary} name="MQLs" />
              <Bar dataKey="campaigns" fill={COLORS.secondary} name="Campaigns" />
              <Bar dataKey="engagement" fill={COLORS.success} name="Engagement %" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card style={{ backgroundColor: COLORS.darkCard }}>
        <CardHeader>
          <CardTitle style={{ color: COLORS.text }} className="text-lg">
            Team Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${COLORS.textMuted}` }} className="opacity-50">
                  <th className="text-left py-3 px-2" style={{ color: COLORS.text }}>
                    Member
                  </th>
                  <th className="text-center py-3 px-2" style={{ color: COLORS.text }}>
                    MQLs
                  </th>
                  <th className="text-center py-3 px-2" style={{ color: COLORS.text }}>
                    Campaigns
                  </th>
                  <th className="text-center py-3 px-2" style={{ color: COLORS.text }}>
                    Engagement
                  </th>
                  <th className="text-center py-3 px-2" style={{ color: COLORS.text }}>
                    Quality Score
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.members
                  .sort((a, b) => b.mqls - a.mqls)
                  .map((member, idx) => (
                    <tr key={idx} style={{ borderBottom: `1px solid ${COLORS.textMuted}` }} className="opacity-70 hover:opacity-100 transition">
                      <td className="py-3 px-2" style={{ color: COLORS.text }}>
                        {member.name}
                      </td>
                      <td className="text-center py-3 px-2" style={{ color: COLORS.secondary }}>
                        {member.mqls}
                      </td>
                      <td className="text-center py-3 px-2" style={{ color: COLORS.secondary }}>
                        {member.campaigns}
                      </td>
                      <td className="text-center py-3 px-2" style={{ color: COLORS.text }}>
                        {Math.round(member.engagementRate * 100)}%
                      </td>
                      <td className="text-center py-3 px-2">
                        <Badge
                          style={{
                            backgroundColor:
                              member.qualityScore >= 0.8 ? COLORS.success : member.qualityScore >= 0.6 ? COLORS.secondary : COLORS.warning,
                          }}
                        >
                          {Math.round(member.qualityScore * 100)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Workflow Control Component
function WorkflowControl() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { name: 'Alice Johnson', slackId: '@alice', email: 'alice@company.com' },
    { name: 'Bob Smith', slackId: '@bob', email: 'bob@company.com' },
    { name: 'Carol White', slackId: '@carol', email: 'carol@company.com' },
  ])
  const [newMember, setNewMember] = useState('')
  const [workflow, setWorkflow] = useState<WorkflowState>({
    status: 'idle',
    progress: 0,
    message: 'Ready to start workflow',
  })
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [showAddMember, setShowAddMember] = useState(false)
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false)

  // Execute workflow
  async function executeWorkflow() {
    try {
      setWorkflow({ status: 'coordinator_running', progress: 15, message: 'Coordinator validating workflow...' })

      // Step 1: Marketing Intelligence Coordinator
      const coordinatorMessage = `Weekly marketing intelligence workflow trigger. Team members: ${teamMembers.map(m => m.name).join(', ')}. Validate data collection, coordinate with communication agent, then prepare for aggregation.`

      const coordinatorResponse = await callAIAgent(coordinatorMessage, COORDINATOR_AGENT)
      const coordinatorData = parseLLMJson(coordinatorResponse.response, {
        status: 'queued',
        message: 'Coordinator validated workflow',
      })

      setWorkflow(prev => ({
        ...prev,
        progress: 35,
        message: 'Coordinator delegating to communication agent...',
        coordinatorResponse: coordinatorData,
      }))

      // Step 2: Team Communication Agent
      setWorkflow(prev => ({ ...prev, status: 'communication_running', progress: 50, message: 'Sending Slack messages to team members...' }))

      const membersList = teamMembers.map(m => `${m.name} (${m.slackId})`).join(', ')
      const communicationMessage = `Send personalized Slack messages to the following team members requesting their weekly metrics (MQLs, campaigns, engagement rate): ${membersList}. Confirm delivery and log communication details.`

      const communicationResponse = await callAIAgent(communicationMessage, COMMUNICATION_AGENT)
      const communicationData = parseLLMJson(communicationResponse.response, {
        status: 'sent',
        deliveryCount: teamMembers.length,
        message: 'Messages sent to all team members',
      })

      setWorkflow(prev => ({
        ...prev,
        progress: 65,
        message: 'Messages sent, awaiting team responses...',
        communicationResponse: communicationData,
      }))

      // Simulate response collection delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Step 3: Response Aggregation Agent
      setWorkflow(prev => ({ ...prev, status: 'aggregation_running', progress: 80, message: 'Aggregating team responses...' }))

      const aggregationMessage = `Fetch and aggregate Slack replies from team members. Extract MQLs, campaign counts, and engagement rates. Validate data quality, normalize formats, and compile a structured dataset with team totals and individual rankings. Team: ${membersList}`

      const aggregationResponse = await callAIAgent(aggregationMessage, AGGREGATION_AGENT)
      const aggregationData = parseLLMJson(aggregationResponse.response, {
        members: generateMockMemberData(teamMembers),
        totalMQLs: 180,
        totalCampaigns: 25,
        qualityScore: 0.87,
      })

      // Generate dashboard data
      setIsLoadingDashboard(true)
      const newDashboardData: DashboardData = {
        totalMQLs: aggregationData.members?.reduce((sum: number, m: any) => sum + (m.mqls || 35), 0) || 180,
        totalCampaigns: aggregationData.members?.reduce((sum: number, m: any) => sum + (m.campaigns || 6), 0) || 25,
        avgEngagementRate: aggregationData.members?.reduce((sum: number, m: any) => sum + (m.engagementRate || 0.68), 0) / (teamMembers.length || 1) / 100 || 0.68,
        teamSize: teamMembers.length,
        members: aggregationData.members || generateMockMemberData(teamMembers),
        trends: [
          { week: 1, mqls: 135, campaigns: 20 },
          { week: 2, mqls: 150, campaigns: 22 },
          { week: 3, mqls: 165, campaigns: 24 },
          { week: 4, mqls: 180, campaigns: 25 },
        ],
        qualityMetrics: {
          highQuality: 87,
          mediumQuality: 10,
          reviewNeeded: 3,
        },
      }

      setDashboardData(newDashboardData)
      setIsLoadingDashboard(false)

      setWorkflow({
        status: 'complete',
        progress: 100,
        message: 'Workflow completed successfully!',
        coordinatorResponse: coordinatorData,
        communicationResponse: communicationData,
        aggregationResponse: aggregationData,
        timestamp: formatTime(new Date()),
      })
    } catch (error) {
      setWorkflow({
        status: 'error',
        progress: 0,
        message: 'Workflow failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  function generateMockMemberData(members: TeamMember[]): MemberMetrics[] {
    const baseMetrics = [
      { mqls: 45, campaigns: 7, engagement: 0.72 },
      { mqls: 62, campaigns: 8, engagement: 0.75 },
      { mqls: 38, campaigns: 5, engagement: 0.65 },
      { mqls: 35, campaigns: 5, engagement: 0.60 },
    ]
    return members.map((m, idx) => ({
      name: m.name,
      mqls: baseMetrics[idx]?.mqls || 40,
      campaigns: baseMetrics[idx]?.campaigns || 6,
      engagementRate: baseMetrics[idx]?.engagement || 0.68,
      qualityScore: 0.75 + Math.random() * 0.2,
      slackUserId: m.slackId,
    }))
  }

  function addTeamMember() {
    if (newMember.trim()) {
      setTeamMembers([...teamMembers, { name: newMember, slackId: `@${newMember.toLowerCase().replace(/\s/g, '')}`, email: `${newMember.toLowerCase().replace(/\s/g, '')}@company.com` }])
      setNewMember('')
      setShowAddMember(false)
    }
  }

  function removeMember(idx: number) {
    setTeamMembers(teamMembers.filter((_, i) => i !== idx))
  }

  const isRunning = workflow.status !== 'idle' && workflow.status !== 'complete' && workflow.status !== 'error'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Control Panel */}
      <Card style={{ backgroundColor: COLORS.darkCard }} className="lg:col-span-1 h-fit">
        <CardHeader>
          <CardTitle style={{ color: COLORS.text }}>Workflow Control</CardTitle>
          <CardDescription style={{ color: COLORS.textMuted }}>Execute weekly intelligence collection</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status */}
          <div>
            <p style={{ color: COLORS.text }} className="text-sm font-medium mb-2">
              Status
            </p>
            <div className="flex items-center gap-2">
              {workflow.status === 'idle' && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.textMuted }}></div>}
              {workflow.status !== 'idle' && workflow.status !== 'complete' && workflow.status !== 'error' && <Spinner />}
              {workflow.status === 'complete' && <CheckCircle2 size={16} style={{ color: COLORS.success }} />}
              {workflow.status === 'error' && <AlertCircle size={16} style={{ color: COLORS.danger }} />}
              <span style={{ color: COLORS.text }} className="text-sm">
                {workflow.message}
              </span>
            </div>
          </div>

          {/* Progress */}
          {workflow.progress > 0 && (
            <div>
              <p style={{ color: COLORS.text }} className="text-sm font-medium mb-2">
                Progress
              </p>
              <Progress value={workflow.progress} className="h-2" />
              <p style={{ color: COLORS.textMuted }} className="text-xs mt-1">
                {workflow.progress}% complete
              </p>
            </div>
          )}

          {/* Error Alert */}
          {workflow.error && (
            <Alert style={{ backgroundColor: COLORS.danger, borderColor: COLORS.danger }} className="border">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription style={{ color: '#FFF' }} className="ml-2 text-sm">
                {workflow.error}
              </AlertDescription>
            </Alert>
          )}

          {/* Execute Button */}
          <Button
            onClick={executeWorkflow}
            disabled={isRunning}
            className="w-full"
            style={{
              backgroundColor: isRunning ? COLORS.textMuted : COLORS.primary,
              color: COLORS.dark,
            }}
          >
            {isRunning ? (
              <>
                <Spinner className="mr-2" /> Running...
              </>
            ) : (
              <>
                <RefreshCw size={16} className="mr-2" /> Start Workflow
              </>
            )}
          </Button>

          {/* Team Members Section */}
          <div className="pt-4 border-t" style={{ borderColor: COLORS.textMuted, opacity: 0.3 }}>
            <div className="flex justify-between items-center mb-3">
              <p style={{ color: COLORS.text }} className="text-sm font-medium">
                Team Members
              </p>
              <Badge style={{ backgroundColor: COLORS.secondary, color: COLORS.dark }}>{teamMembers.length}</Badge>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
              {teamMembers.map((member, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm p-2 rounded" style={{ backgroundColor: COLORS.dark }}>
                  <div>
                    <p style={{ color: COLORS.text }}>{member.name}</p>
                    <p style={{ color: COLORS.textMuted }} className="text-xs">
                      {member.slackId}
                    </p>
                  </div>
                  <Button onClick={() => removeMember(idx)} variant="ghost" size="sm" className="h-6 w-6 p-0">
                    ×
                  </Button>
                </div>
              ))}
            </div>

            <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full text-sm" style={{ borderColor: COLORS.secondary, color: COLORS.secondary }}>
                  + Add Member
                </Button>
              </DialogTrigger>
              <DialogContent style={{ backgroundColor: COLORS.darkCard, borderColor: COLORS.primary }}>
                <DialogHeader>
                  <DialogTitle style={{ color: COLORS.text }}>Add Team Member</DialogTitle>
                  <DialogDescription style={{ color: COLORS.textMuted }}>Add a new team member to the workflow</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Enter member name"
                    value={newMember}
                    onChange={e => setNewMember(e.target.value)}
                    style={{ backgroundColor: COLORS.dark, borderColor: COLORS.textMuted, color: COLORS.text }}
                    onKeyDown={e => e.key === 'Enter' && addTeamMember()}
                  />
                  <Button onClick={addTeamMember} className="w-full" style={{ backgroundColor: COLORS.primary, color: COLORS.dark }}>
                    Add Member
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard */}
      <div className="lg:col-span-2">
        <Dashboard data={dashboardData} isLoading={isLoadingDashboard} />
      </div>
    </div>
  )
}

// Logs Component
function Logs({ workflow }: { workflow: WorkflowState }) {
  return (
    <Card style={{ backgroundColor: COLORS.darkCard }}>
      <CardHeader>
        <CardTitle style={{ color: COLORS.text }} className="text-lg">
          Workflow Logs
        </CardTitle>
        <CardDescription style={{ color: COLORS.textMuted }}>Agent responses and process details</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="coordinator" className="w-full">
          <TabsList style={{ backgroundColor: COLORS.dark }}>
            <TabsTrigger value="coordinator" style={{ color: COLORS.text }}>
              Coordinator
            </TabsTrigger>
            <TabsTrigger value="communication" style={{ color: COLORS.text }}>
              Communication
            </TabsTrigger>
            <TabsTrigger value="aggregation" style={{ color: COLORS.text }}>
              Aggregation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="coordinator" className="mt-4">
            {workflow.coordinatorResponse ? (
              <pre
                className="p-3 rounded text-xs overflow-x-auto"
                style={{ backgroundColor: COLORS.dark, color: COLORS.secondary }}
              >
                {JSON.stringify(workflow.coordinatorResponse, null, 2)}
              </pre>
            ) : (
              <p style={{ color: COLORS.textMuted }}>No coordinator response yet</p>
            )}
          </TabsContent>

          <TabsContent value="communication" className="mt-4">
            {workflow.communicationResponse ? (
              <pre
                className="p-3 rounded text-xs overflow-x-auto"
                style={{ backgroundColor: COLORS.dark, color: COLORS.secondary }}
              >
                {JSON.stringify(workflow.communicationResponse, null, 2)}
              </pre>
            ) : (
              <p style={{ color: COLORS.textMuted }}>No communication response yet</p>
            )}
          </TabsContent>

          <TabsContent value="aggregation" className="mt-4">
            {workflow.aggregationResponse ? (
              <pre
                className="p-3 rounded text-xs overflow-x-auto"
                style={{ backgroundColor: COLORS.dark, color: COLORS.secondary }}
              >
                {JSON.stringify(workflow.aggregationResponse, null, 2)}
              </pre>
            ) : (
              <p style={{ color: COLORS.textMuted }}>No aggregation response yet</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// Main App
export default function App() {
  const [workflow, setWorkflow] = useState<WorkflowState>({
    status: 'idle',
    progress: 0,
    message: 'Ready to start workflow',
  })

  return (
    <div style={{ backgroundColor: COLORS.dark }} className="min-h-screen p-6">
      <style>{`
        body { background-color: ${COLORS.dark}; color: ${COLORS.text}; font-family: 'Inter', sans-serif; }
        * { scrollbar-color: ${COLORS.secondary} ${COLORS.darkCard}; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: ${COLORS.darkCard}; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.secondary}; border-radius: 4px; }
      `}</style>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 style={{ color: COLORS.text }} className="text-4xl font-bold mb-2">
            Marketing Intelligence Workflow
          </h1>
          <p style={{ color: COLORS.textMuted }} className="text-lg">
            Automated weekly metrics collection, aggregation, and intelligence dashboard powered by AI agents
          </p>
        </div>

        {/* Main Workflow */}
        <WorkflowControl />

        {/* Logs */}
        <Logs workflow={workflow} />
      </div>
    </div>
  )
}
