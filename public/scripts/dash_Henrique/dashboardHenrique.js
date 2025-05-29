// GRAFICO BAR QUANTIDADE DE ALERTAS EM ABERTO POR HORA
var timelineAlertas = {
    grid: {
        padding: {
            top: -20,
            right: -10,
            bottom: -20,
        }
    },
    chart: {
        type: 'bar',
        height: '100%',
        width: '100%',
        toolbar: {
            show: false
        }
    },
    dataLabels: {
        enabled: true,
        style: {
            fontSize: '12px',
            colors: ['#000']
        },
        dropShadow: {
            enabled: false
        }
    },
    series: [
        {
            name: 'CPU',
            data: [6, 5, 6, 6, 6, 5]
        },
        {
            name: 'Memória',
            data: [14, 14, 14, 14, 14, 14]
        },
        {
            name: 'Disco',
            data: [10, 10, 10, 10, 10, 10]
        },
        {
            name: 'Rede',
            data: [11, 11, 11, 11, 11, 11]
        },
        {
            name: 'Bateria',
            data: [13, 13, 13, 13, 13, 13]
        },
        {
            name: 'Tempo de Uso',
            data: [13, 13, 13, 13, 13, 13]
        }
    ],
    xaxis: {
        categories: ['20hrs', '21hrs', '22 hrs', '23hrs', '00 hrs', '01 hrs'],
        title: {
            text: 'Hora',
            offsetY: -10,
            style: {
                fontWeight: 'bold'
            }
        },
        offsetY: -10
    },
    yaxis: {
        title: {
            text: 'Quantidade'
        },
        min: 0,
        max: 16
    },
    plotOptions: {
        bar: {
            horizontal: false,
            columnWidth: '80%',
            endingShape: 'flat'
        }
    },
    colors: ['#FDE047', '#4ADE80', '#38BDF8', '#F472B6', '#FB923C'],
    legend: {
        position: 'top',
    }
};

var timelineAlertasTela = new ApexCharts(document.querySelector("#timelineAlertas"), timelineAlertas);
timelineAlertasTela.render();

// GRAFICO ROSCA
var graficoRosca = {
    chart: {
        type: 'donut',
        height: '80%',
        width: '100%',
    },
    series: [15,15,15,15,15,25],
    labels: ['Produto A', 'Produto B', 'Produto C', 'Produto D', 'Produto E' , 'Produto F'],
    plotOptions: {
        pie: {
            donut: {
                size: '50%'  
            }
        }
    },
    dataLabels: {
        dropShadow: {
            enabled: false 
        },
        style: {
            colors: ['#000'],
            fontSize: '14px' 
        }
    },
    legend: {
        position: 'right',         
        horizontalAlign: 'center' ,    
        offsetY: -10,        
        offsetX: 30         
    },
    responsive: [{
        breakpoint: 480,
        options: {
            legend: {
                position: 'bottom'
            }
        }
    }]
};

var graficoRoscaTela = new ApexCharts(document.querySelector("#graficoRosca"), graficoRosca);
graficoRoscaTela.render();