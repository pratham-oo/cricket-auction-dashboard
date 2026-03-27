import * as XLSX from 'xlsx';
import { Player, Team, AuctionLog } from '@/types';

interface ExportData {
  playerName: string;
  playerRole: string;
  soldPrice: number;
  soldToTeam: string;
  soldDate: string;
  teamBudget: number;
  teamTotalPlayers: number;
}

export const exportToExcel = (soldPlayers: Player[], teams: Team[], logs: AuctionLog[]) => {
  // Prepare data for export
  const exportData: ExportData[] = [];

  soldPlayers.forEach(player => {
    const team = teams.find(t => t.id === player.sold_to);
    const log = logs.find(l => l.player_id === player.id && l.action === 'sold');
    
    exportData.push({
      playerName: player.name,
      playerRole: player.role,
      soldPrice: player.sold_price || 0,
      soldToTeam: team?.team_name || 'Unknown',
      soldDate: log ? new Date(log.created_at).toLocaleString() : 'Unknown',
      teamBudget: team?.budget || 0,
      teamTotalPlayers: (team?.total_players || 2) - 2, // Subtract icon + owner
    });
  });

  // Sort by sold date (newest first)
  exportData.sort((a, b) => new Date(b.soldDate).getTime() - new Date(a.soldDate).getTime());

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 25 }, // Player Name
    { wch: 15 }, // Role
    { wch: 12 }, // Price
    { wch: 20 }, // Team
    { wch: 20 }, // Date
    { wch: 12 }, // Team Budget
    { wch: 15 }, // Team Players
  ];

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Auction Sales');

  // Generate filename with current date
  const fileName = `auction_sales_${new Date().toISOString().split('T')[0]}.xlsx`;

  // Download file
  XLSX.writeFile(workbook, fileName);
};

export const exportSummaryToExcel = (teams: Team[], soldPlayers: Player[]) => {
  // Prepare summary data
  const summaryData = teams.map(team => {
    const teamSoldPlayers = soldPlayers.filter(p => p.sold_to === team.id);
    const totalSpent = teamSoldPlayers.reduce((sum, p) => sum + (p.sold_price || 0), 0);
    const remainingBudget = team.budget;
    
    return {
      teamName: team.team_name,
      ownerName: team.owner_name,
      iconPlayer: team.icon_player_name,
      auctionPlayersBought: teamSoldPlayers.length,
      totalSpent: totalSpent,
      remainingBudget: remainingBudget,
      totalBudget: 2500,
      budgetStatus: remainingBudget < 0 ? 'Over Budget' : 'Within Budget',
    };
  });

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(summaryData);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 20 }, // Team Name
    { wch: 20 }, // Owner
    { wch: 20 }, // Icon Player
    { wch: 18 }, // Players Bought
    { wch: 12 }, // Total Spent
    { wch: 15 }, // Remaining
    { wch: 12 }, // Total Budget
    { wch: 15 }, // Status
  ];

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Team Summary');

  // Download file
  const fileName = `auction_summary_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

export const exportFullReport = (soldPlayers: Player[], teams: Team[], logs: AuctionLog[]) => {
  // Create a workbook with multiple sheets
  const workbook = XLSX.utils.book_new();

  // Sheet 1: All Sales
  const salesData = soldPlayers.map(player => {
    const team = teams.find(t => t.id === player.sold_to);
    const log = logs.find(l => l.player_id === player.id && l.action === 'sold');
    
    return {
      'Player Name': player.name,
      'Role': player.role,
      'Sold Price': player.sold_price || 0,
      'Sold To': team?.team_name || 'Unknown',
      'Sold Date': log ? new Date(log.created_at).toLocaleString() : 'Unknown',
    };
  });
  const salesSheet = XLSX.utils.json_to_sheet(salesData);
  XLSX.utils.book_append_sheet(workbook, salesSheet, 'All Sales');

  // Sheet 2: Team Summary
  const summaryData = teams.map(team => {
    const teamSoldPlayers = soldPlayers.filter(p => p.sold_to === team.id);
    const totalSpent = teamSoldPlayers.reduce((sum, p) => sum + (p.sold_price || 0), 0);
    
    return {
      'Team Name': team.team_name,
      'Owner': team.owner_name,
      'Icon Player': team.icon_player_name,
      'Auction Players': teamSoldPlayers.length,
      'Total Spent': totalSpent,
      'Remaining Budget': team.budget,
      'Status': team.budget < 0 ? 'Over Budget' : 'Within Budget',
    };
  });
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Team Summary');

  // Sheet 3: Team-wise Players
  teams.forEach(team => {
    const teamPlayers = soldPlayers.filter(p => p.sold_to === team.id);
    if (teamPlayers.length > 0) {
      const playersData = teamPlayers.map(player => ({
        'Player Name': player.name,
        'Role': player.role,
        'Price': player.sold_price || 0,
      }));
      const playersSheet = XLSX.utils.json_to_sheet(playersData);
      // Use safe sheet name (max 31 characters)
      const sheetName = team.team_name.substring(0, 31);
      XLSX.utils.book_append_sheet(workbook, playersSheet, sheetName);
    }
  });

  // Download file
  const fileName = `auction_full_report_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

// NEW: Owner-specific export functions
export const exportOwnerTeam = (team: Team, teamPlayers: Player[], logs: AuctionLog[]) => {
  // Prepare data for owner's team
  const playersData = [
    {
      'Player Name': team.icon_player_name,
      'Role': team.icon_player_role,
      'Type': 'Icon Player',
      'Price': 'Pre-assigned',
      'Sold Date': 'Pre-auction',
    },
    {
      'Player Name': team.owner_name,
      'Role': 'All-rounder',
      'Type': 'Team Owner/Captain',
      'Price': 'Pre-assigned',
      'Sold Date': 'Pre-auction',
    },
    ...teamPlayers.map(player => {
      const log = logs.find(l => l.player_id === player.id && l.action === 'sold');
      return {
        'Player Name': player.name,
        'Role': player.role,
        'Type': 'Auction Player',
        'Price': player.sold_price || 0,
        'Sold Date': log ? new Date(log.created_at).toLocaleString() : 'Unknown',
      };
    })
  ];

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(playersData);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 25 }, // Player Name
    { wch: 15 }, // Role
    { wch: 15 }, // Type
    { wch: 12 }, // Price
    { wch: 20 }, // Sold Date
  ];

  // Create workbook with summary sheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `${team.team_name} Squad`);

  // Add summary sheet
  const totalSpent = teamPlayers.reduce((sum, p) => sum + (p.sold_price || 0), 0);
  const remainingBudget = team.budget;
  
  const summaryData = [{
    'Team Name': team.team_name,
    'Owner': team.owner_name,
    'Icon Player': team.icon_player_name,
    'Total Players': teamPlayers.length + 2,
    'Auction Players': teamPlayers.length,
    'Total Spent': totalSpent,
    'Remaining Budget': remainingBudget,
    'Budget Status': remainingBudget < 0 ? 'Over Budget' : 'Within Budget',
  }];
  
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Team Summary');

  // Download file
  const fileName = `${team.team_name}_squad_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

export const exportOwnerBudget = (team: Team, teamPlayers: Player[]) => {
  const totalSpent = teamPlayers.reduce((sum, p) => sum + (p.sold_price || 0), 0);
  const playersNeeded = 9 - teamPlayers.length;
  
  const budgetData = [
    {
      'Category': 'Initial Budget',
      'Amount': 2500,
      'Note': 'Starting purse for auction',
    },
    {
      'Category': 'Total Spent',
      'Amount': -totalSpent,
      'Note': `Spent on ${teamPlayers.length} auction players`,
    },
    {
      'Category': 'Remaining Budget',
      'Amount': team.budget,
      'Note': team.budget < 0 ? 'Over budget!' : 'Available for remaining players',
    },
    {
      'Category': 'Players Still Needed',
      'Amount': playersNeeded,
      'Note': `${playersNeeded} more players required from auction`,
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(budgetData);
  
  worksheet['!cols'] = [
    { wch: 20 },
    { wch: 15 },
    { wch: 30 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `${team.team_name} Budget`);
  
  const fileName = `${team.team_name}_budget_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};