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
  transacciones: any[] = [];
  pagosPendientes: any[] = [];
  pagosHechos: any[] = [];

  totalTransacciones = 0;
  totalPendientes = 0;
  totalHechos = 0;

  pieChartLabels: string[] = [];
  pieChartData: number[] = [];
  pieChartType: ChartType = 'pie';
  pieChart: { labels: string[], datasets: { data: number[] }[] } = { labels: [], datasets: [{ data: [] }] };

  barChartLabels: string[] = [];
  barChartData: ChartDataset[] = [
    { data: [], label: 'Ingresos' },
    { data: [], label: 'Gastos' }
  ];
  barChartOptions: ChartOptions = { responsive: true };
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
          this.transacciones = movements.filter(m => m.type !== 'pago_pendiente');
          this.pagosPendientes = movements.filter(m => m.type === 'pago_pendiente' && m.status === 'pendiente');
          this.pagosHechos = movements.filter(m => m.type === 'pago_pendiente' && m.status === 'hecho');

          this.totalTransacciones = this.transacciones.length;
          this.totalPendientes = this.pagosPendientes.length;
          this.totalHechos = this.pagosHechos.length;

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
      else if (m.type === 'expense') gastosPorMes[month] += m.amount;
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
exportarResumenPDF() {
  const doc = new jsPDF();
  doc.text('Resumen Financiero Completo', 14, 10);

  // Tabla resumen
  autoTable(doc, {
    startY: 20,
    head: [['Ingresos', 'Gastos', 'Balance', 'Transacciones', 'Pendientes', 'Hechos']],
    body: [[
      this.ingresos.toFixed(2),
      this.gastos.toFixed(2),
      this.balance.toFixed(2),
      this.totalTransacciones,
      this.totalPendientes,
      this.totalHechos
    ]]
  });

  const resumenFinalY = (doc as any).lastAutoTable.finalY || 30;

  // Transacciones
  autoTable(doc, {
    startY: resumenFinalY + 10,
    head: [['Descripción', 'Categoría', 'Monto', 'Fecha', 'Tipo']],
    body: this.transacciones.map(t => [
      t.description,
      t.category,
      t.amount,
      new Date(t.date?.seconds * 1000).toLocaleDateString(),
      t.type
    ])
  });

  const transFinalY = (doc as any).lastAutoTable.finalY || resumenFinalY + 30;

  // Pagos por hacer (pendientes y hechos)
  autoTable(doc, {
    startY: transFinalY + 10,
    head: [['Descripción', 'Categoría', 'Monto', 'Fecha límite', 'Estado']],
    body: [...this.pagosPendientes, ...this.pagosHechos].map(p => [
      p.description,
      p.category,
      p.amount,
      new Date(p.dueDate?.seconds * 1000).toLocaleDateString(),
      p.status
    ])
  });

  doc.save('resumen_financiero_completo.pdf');
}


  exportarResumenExcel() {
    const resumen = [
      ['Ingresos', 'Gastos', 'Balance', 'Transacciones', 'Pendientes', 'Hechos'],
      [this.ingresos, this.gastos, this.balance, this.totalTransacciones, this.totalPendientes, this.totalHechos]
    ];

    const transacciones = [
      ['Descripción', 'Categoría', 'Monto', 'Fecha', 'Tipo'],
      ...this.transacciones.map(t => [
        t.description, t.category, t.amount, new Date(t.date.seconds * 1000).toLocaleDateString(), t.type
      ])
    ];

    const pagos = [
      ['Descripción', 'Categoría', 'Monto', 'Fecha Límite', 'Estado'],
      ...[...this.pagosPendientes, ...this.pagosHechos].map(p => [
        p.description, p.category, p.amount, new Date(p.dueDate.seconds * 1000).toLocaleDateString(), p.status
      ])
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resumen), 'Resumen');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(transacciones), 'Transacciones');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(pagos), 'Pagos por hacer');

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(data, 'resumen_financiero_completo.xlsx');
  }
}
