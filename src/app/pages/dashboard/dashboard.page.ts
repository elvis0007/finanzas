// src/app/pages/dashboard/dashboard.page.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { MovementsService } from '../../services/movements.service';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
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
export class DashboardPage implements OnInit, OnDestroy {
  ingresos = 0;
  gastos = 0;
  balance = 0;

  pieChartLabels: string[] = [];
  pieChartData: number[] = [];
  pieChartType: ChartType = 'pie';
  pieChart: { labels: string[], datasets: { data: number[], backgroundColor?: string[] }[] } = { 
    labels: [], 
    datasets: [{ data: [], backgroundColor: [] }] 
  };

  barChartLabels: string[] = [];
  barChartData: ChartDataset[] = [
    { data: [], label: 'Ingresos' },
    { data: [], label: 'Gastos' }
  ];
  barChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: '600'
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(148, 163, 184, 0.2)'
        },
        ticks: {
          font: {
            size: 11
          }
        }
      },
      x: {
        grid: {
          color: 'rgba(148, 163, 184, 0.2)'
        },
        ticks: {
          font: {
            size: 11
          }
        }
      }
    }
  };
  barChartType: ChartType = 'bar';
  barChart: { labels: string[], datasets: ChartDataset[] } = { labels: [], datasets: [] };

  private themeSubscription?: Subscription;
  private isDarkMode = false;

  constructor(
    private movementsService: MovementsService,
    private authService: AuthService,
    private themeService: ThemeService
  ) {}

  ngOnInit() {
    // Suscribirse a cambios de tema
    this.themeSubscription = this.themeService.darkMode$.subscribe(
      isDark => {
        this.isDarkMode = isDark;
        this.updateChartTheme();
      }
    );

    // Cargar datos
    this.authService.getCurrentUser().then(user => {
      if (user) {
        this.movementsService.getMovements(user.uid).subscribe(movements => {
          this.calcularResumen(movements);
          this.generarGraficos(movements);
        });
      }
    });
  }

  ngOnDestroy() {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }

  calcularResumen(movements: any[]) {
    this.ingresos = movements.filter(m => m.type === 'income').reduce((sum, m) => sum + m.amount, 0);
    this.gastos = movements.filter(m => m.type === 'expense').reduce((sum, m) => sum + m.amount, 0);
    this.balance = this.ingresos - this.gastos;
  }

  generarGraficos(movements: any[]) {
    const categoriasMap = new Map<string, number>();
    movements.forEach(m => {
      categoriasMap.set(m.category, (categoriasMap.get(m.category) || 0) + Math.abs(m.amount));
    });

    this.pieChartLabels = Array.from(categoriasMap.keys());
    this.pieChartData = Array.from(categoriasMap.values());
    
    // Colores para el gráfico circular
    const pieColors = [
      '#6366F1', '#34D399', '#F87171', '#FBBF24', '#8B5CF6', 
      '#10B981', '#EF4444', '#F59E0B', '#3B82F6', '#EC4899'
    ];

    this.pieChart = {
      labels: this.pieChartLabels,
      datasets: [{ 
        data: this.pieChartData,
        backgroundColor: pieColors.slice(0, this.pieChartData.length)
      }]
    };

    // Gráfico de barras mensual
    const ingresosPorMes = Array(12).fill(0);
    const gastosPorMes = Array(12).fill(0);

    movements.forEach(m => {
      const date = m.date instanceof Date ? m.date : m.date.toDate ? m.date.toDate() : new Date(m.date.seconds * 1000);
      const month = date.getMonth();
      if (m.type === 'income') ingresosPorMes[month] += m.amount;
      else gastosPorMes[month] += Math.abs(m.amount);
    });

    this.barChartLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    this.barChartData = [
      { 
        data: ingresosPorMes, 
        label: 'Ingresos',
        backgroundColor: '#34D399',
        borderColor: '#10B981',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false
      },
      { 
        data: gastosPorMes, 
        label: 'Gastos',
        backgroundColor: '#F87171',
        borderColor: '#EF4444',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false
      }
    ];
    
    this.barChart = {
      labels: this.barChartLabels,
      datasets: this.barChartData
    };

    this.updateChartTheme();
  }

  private updateChartTheme() {
    const textColor = this.isDarkMode ? '#F1F5F9' : '#374151';
    const gridColor = this.isDarkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.2)';

    // Actualizar opciones del gráfico de barras
    this.barChartOptions = {
      ...this.barChartOptions,
      plugins: {
        ...this.barChartOptions.plugins,
        legend: {
          ...this.barChartOptions.plugins?.legend,
          labels: {
            ...this.barChartOptions.plugins?.legend?.labels,
            color: textColor
          }
        }
      },
      scales: {
        ['y']: {
          ...this.barChartOptions.scales?.['y'],
          grid: {
            color: gridColor
          },
          ticks: {
            ...this.barChartOptions.scales?.['y']?.ticks,
            color: textColor
          }
        },
        ['x']: {
          ...this.barChartOptions.scales?.['x'],
          grid: {
            color: gridColor
          },
          ticks: {
            ...this.barChartOptions.scales?.['x']?.ticks,
            color: textColor
          }
        }
      }
    };
  }

  exportarPDF() {
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumen Financiero', 14, 20);
    
    // Fecha
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 30);

    // Tabla de resumen
    autoTable(doc, {
      startY: 40,
      head: [['Concepto', 'Cantidad']],
      body: [
        ['Ingresos', `$${this.ingresos.toFixed(2)}`],
        ['Gastos', `$${this.gastos.toFixed(2)}`],
        ['Balance', `$${this.balance.toFixed(2)}`]
      ],
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] },
      styles: { fontSize: 12 }
    });

    doc.save('resumen_financiero.pdf');
  }

  exportarCSV() {
    const worksheetData = [
      ['Resumen Financiero'],
      [''],
      ['Concepto', 'Cantidad'],
      ['Ingresos', this.ingresos],
      ['Gastos', this.gastos],
      ['Balance', this.balance],
      [''],
      ['Datos Mensuales'],
      [''],
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