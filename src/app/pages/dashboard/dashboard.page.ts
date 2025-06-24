import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { MovementsService } from '../../services/movements.service';
import { AuthService } from '../../services/auth.service';
import { ChartOptions, ChartType, ChartDataset } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import FileSaver from 'file-saver';


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, NgChartsModule]
})
export class DashboardPage implements OnInit {
  ingresos = 0;
  gastos = 0;
  balance = 0;

  pieChartLabels: string[] = [];
  pieChartData: number[] = [];
  pieChartType: ChartType = 'pie';
  pieChart: { labels: string[], datasets: { data: number[] }[] } = { labels: [], datasets: [{ data: [] }] };

  barChartLabels: string[] = [];
  barChartData: ChartDataset[] = [
    { data: [], label: 'Ingresos' },
    { data: [], label: 'Gastos' }
  ];
  barChartOptions: ChartOptions = {
    responsive: true,
  };
  barChartType: ChartType = 'bar';
  barChart: { labels: string[], datasets: ChartDataset[] } = { labels: [], datasets: [] };

  constructor(
    private movementsService: MovementsService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.authService.getCurrentUser().then(user => {
      if (user) {
        this.movementsService.getMovements(user.uid).subscribe(movements => {
          this.calcularResumen(movements);
          this.generarGraficos(movements);
        });
      }
    });
  }

  calcularResumen(movements: any[]) {
    this.ingresos = movements.filter(m => m.type === 'income').reduce((sum, m) => sum + m.amount, 0);
    this.gastos = movements.filter(m => m.type === 'expense').reduce((sum, m) => sum + m.amount, 0);
    this.balance = this.ingresos - this.gastos;
  }

  generarGraficos(movements: any[]) {
    const categoriasMap = new Map<string, number>();
    movements.forEach(m => {
      categoriasMap.set(m.category, (categoriasMap.get(m.category) || 0) + m.amount);
    });

    this.pieChartLabels = Array.from(categoriasMap.keys());
    this.pieChartData = Array.from(categoriasMap.values());
    this.pieChart = {
      labels: this.pieChartLabels,
      datasets: [{ data: this.pieChartData }]
    };

    const ingresosPorMes = Array(12).fill(0);
    const gastosPorMes = Array(12).fill(0);

    movements.forEach(m => {
      const date = m.date instanceof Date ? m.date : m.date.toDate ? m.date.toDate() : new Date(m.date.seconds * 1000);
      const month = date.getMonth();
      if (m.type === 'income') ingresosPorMes[month] += m.amount;
      else gastosPorMes[month] += m.amount;
    });

    this.barChartLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    this.barChartData = [
      { data: ingresosPorMes, label: 'Ingresos' },
      { data: gastosPorMes, label: 'Gastos' }
    ];
    this.barChart = {
      labels: this.barChartLabels,
      datasets: this.barChartData
    };
  }
  exportarPDF() {
  const doc = new jsPDF();
  doc.text('Resumen Financiero', 14, 10);

  autoTable(doc, {
    startY: 20,
    head: [['Ingresos', 'Gastos', 'Balance']],
    body: [[
      this.ingresos.toFixed(2),
      this.gastos.toFixed(2),
      this.balance.toFixed(2)
    ]]
  });

  doc.save('resumen_financiero.pdf');
}

exportarCSV() {
  const worksheetData = [
    ['Mes', 'Ingresos', 'Gastos'],
    ...this.barChartLabels.map((mes, i) => [
      mes,
      this.barChartData[0].data[i] || 0,
      this.barChartData[1].data[i] || 0
    ])
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = { Sheets: { 'Resumen': worksheet }, SheetNames: ['Resumen'] };
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
  FileSaver.saveAs(data, 'resumen_financiero.xlsx');
}

}
