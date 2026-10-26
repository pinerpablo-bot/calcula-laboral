/**
 * CalculaLaboral 2026 - app.js
 * Reescritura total O(1): Cálculos matemáticos directos, cero bloqueos y cero efectos secundarios.
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // =========================================================================
  // 1. UTILIDADES PURAS DE FORMATEO Y ACCESO SEGURO AL DOM
  // =========================================================================
  function formatDecimal(num) {
    if (!Number.isFinite(num)) {
      return '0,00';
    }
    var fixed = Math.abs(num).toFixed(2);
    var parts = fixed.split('.');
    var intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    var sign = num < 0 ? '-' : '';
    return sign + intPart + ',' + parts[1];
  }

  function formatEuro(num) {
    return formatDecimal(num) + ' €';
  }

  function formatPercent(num) {
    return formatDecimal(num) + '%';
  }

  function readFloat(el, fallback) {
    if (!el) {
      return fallback;
    }
    var parsed = parseFloat(el.value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function setText(el, value) {
    if (el) {
      el.textContent = value;
    }
  }

  function setWidth(el, pct) {
    if (el) {
      var safePct = Number.isFinite(pct) ? Math.max(0, Math.min(100, pct)) : 0;
      el.style.width = safePct.toFixed(1) + '%';
    }
  }

  // =========================================================================
  // 2. SISTEMA DE PESTAÑAS (SOLO CLICK + CLASE .active)
  // =========================================================================
  var tabButtons = document.querySelectorAll('.tab-btn');
  var tabPanels = document.querySelectorAll('.tab-panel');

  for (var t = 0; t < tabButtons.length; t++) {
    tabButtons[t].addEventListener('click', function () {
      var targetId = this.getAttribute('data-tab');
      if (!targetId) {
        return;
      }

      for (var i = 0; i < tabButtons.length; i++) {
        tabButtons[i].classList.remove('active');
        tabButtons[i].setAttribute('aria-selected', 'false');
      }

      for (var j = 0; j < tabPanels.length; j++) {
        tabPanels[j].classList.remove('active');
      }

      this.classList.add('active');
      this.setAttribute('aria-selected', 'true');

      var targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  }

  // =========================================================================
  // 3. CONSTANTES Y ESCALA IRPF 2026 (O(1))
  // =========================================================================
  var BASE_MAX_SS_2026 = 58914.0;
  var TOPE_EXENTO_IRPF_DESPIDO = 180000.0;

  function cuotaPorTramosIRPF(base) {
    if (!Number.isFinite(base) || base <= 0) {
      return 0;
    }
    var cuota = 0;

    // Tramo 1: 0 a 12.450 € (19%)
    cuota += Math.min(base, 12450.0) * 0.19;

    // Tramo 2: 12.450 a 20.200 € (24%)
    if (base > 12450.0) {
      cuota += Math.min(base - 12450.0, 7750.0) * 0.24;
    }

    // Tramo 3: 20.200 a 35.200 € (30%)
    if (base > 20200.0) {
      cuota += Math.min(base - 20200.0, 15000.0) * 0.30;
    }

    // Tramo 4: 35.200 a 60.000 € (37%)
    if (base > 35200.0) {
      cuota += Math.min(base - 35200.0, 24800.0) * 0.37;
    }

    // Tramo 5: 60.000 a 300.000 € (45%)
    if (base > 60000.0) {
      cuota += Math.min(base - 60000.0, 240000.0) * 0.45;
    }

    // Tramo 6: Más de 300.000 € (47%)
    if (base > 300000.0) {
      cuota += (base - 300000.0) * 0.47;
    }

    return cuota;
  }

  // =========================================================================
  // 4. PANEL 1: SUELDO NETO (BRUTO A NETO)
  // =========================================================================
  var elNetoBruto = document.getElementById('neto-bruto');
  var elNetoPagas = document.getElementById('neto-pagas');
  var elNetoContrato = document.getElementById('neto-contrato');
  var elNetoEdad = document.getElementById('neto-edad');
  var elNetoSituacion = document.getElementById('neto-situacion');
  var elNetoHijos = document.getElementById('neto-hijos');
  var elNetoDiscapacidad = document.getElementById('neto-discapacidad');

  var outNetoMensual = document.getElementById('res-neto-mensual');
  var outNetoSubPagas = document.getElementById('res-neto-sub-pagas');
  var rowPagaExtra = document.getElementById('row-paga-extra');
  var outNetoExtra = document.getElementById('res-neto-extra');
  var outNetoAnual = document.getElementById('res-neto-anual');
  var outIrpfPct = document.getElementById('res-irpf-porcentaje');
  var outIrpfAnual = document.getElementById('res-irpf-anual');
  var outIrpfMensual = document.getElementById('res-irpf-mensual');
  var outSsPct = document.getElementById('res-ss-porcentaje');
  var outSsAnual = document.getElementById('res-ss-anual');
  var outSsMensual = document.getElementById('res-ss-mensual');

  var barNetoPct = document.getElementById('bar-neto-pct');
  var barIrpfPct = document.getElementById('bar-irpf-pct');
  var barSsPct = document.getElementById('bar-ss-pct');
  var legNeto = document.getElementById('leg-neto');
  var legIrpf = document.getElementById('leg-irpf');
  var legSs = document.getElementById('leg-ss');

  function calcularSueldoNeto() {
    var bruto = Math.max(0, readFloat(elNetoBruto, 0));
    var pagas = Math.round(readFloat(elNetoPagas, 14)) === 12 ? 12 : 14;
    var contrato = elNetoContrato ? elNetoContrato.value : 'indefinido';
    var edad = Math.max(16, Math.min(99, Math.round(readFloat(elNetoEdad, 35))));
    var situacion = elNetoSituacion ? elNetoSituacion.value : 'soltero';
    var hijos = Math.max(0, Math.round(readFloat(elNetoHijos, 0)));
    var discapacidad = elNetoDiscapacidad ? elNetoDiscapacidad.value : 'ninguna';

    var tipoSS = contrato === 'temporal' ? 6.55 : 6.50;

    if (bruto <= 0) {
      setText(outNetoMensual, '0,00 €');
      setText(outNetoExtra, '0,00 €');
      setText(outNetoAnual, '0,00 €');
      setText(outIrpfPct, 'Tipo efectivo: 0,00%');
      setText(outIrpfAnual, '0,00 € / año');
      setText(outIrpfMensual, '(0,00 € / mes)');
      setText(outSsPct, 'Tipo cotización: ' + formatPercent(tipoSS));
      setText(outSsAnual, '0,00 € / año');
      setText(outSsMensual, '(0,00 € / mes)');
      setWidth(barNetoPct, 0);
      setWidth(barIrpfPct, 0);
      setWidth(barSsPct, 0);
      setText(legNeto, '0,00%');
      setText(legIrpf, '0,00%');
      setText(legSs, '0,00%');
      return;
    }

    var baseCotSS = Math.min(bruto, BASE_MAX_SS_2026);
    var ssAnual = baseCotSS * (tipoSS / 100.0);
    var ssMensual = ssAnual / 12.0;

    // Rendimiento neto previo = Bruto - SS - 2.000 € gastos deducibles generales
    var rendNetoPrevio = Math.max(0, bruto - ssAnual - 2000.0);

    // Reducción art. 20 LIRPF para rentas bajas
    var reduccionArt20 = 0;
    if (rendNetoPrevio <= 14047.50) {
      reduccionArt20 = 6498.0;
    } else if (rendNetoPrevio < 19747.50) {
      reduccionArt20 = Math.max(0, 6498.0 - 1.1429 * (rendNetoPrevio - 14047.50));
    }

    var baseLiquidable = Math.max(0, rendNetoPrevio - reduccionArt20);

    // Mínimo personal y familiar
    var minimoPF = 5550.0;
    if (edad >= 75) {
      minimoPF += 2550.0;
    } else if (edad >= 65) {
      minimoPF += 1150.0;
    }

    if (hijos === 1) {
      minimoPF += 2400.0;
    } else if (hijos === 2) {
      minimoPF += 5100.0;
    } else if (hijos === 3) {
      minimoPF += 9100.0;
    } else if (hijos >= 4) {
      minimoPF += 13600.0;
    }

    if (discapacidad === '33_65') {
      minimoPF += 3000.0;
    } else if (discapacidad === 'mas_65') {
      minimoPF += 9000.0;
    }

    var cuotaIRPF = Math.max(0, cuotaPorTramosIRPF(baseLiquidable) - cuotaPorTramosIRPF(minimoPF));

    // Umbral exento de retención (art. 81 RIRPF / SMI 2026)
    var umbralExento = 15876.0;
    if (situacion === 'casado_sin_ingresos') {
      umbralExento = 17197.0 + hijos * 1200.0;
    } else if (hijos > 0) {
      umbralExento = 16300.0 + hijos * 1000.0;
    }

    if (bruto <= umbralExento) {
      cuotaIRPF = 0;
    }

    var tipoEfectivoIRPF = (cuotaIRPF / bruto) * 100.0;
    var irpfAnual = cuotaIRPF;
    var netoAnual = Math.max(0, bruto - ssAnual - irpfAnual);

    var netoMensual = 0;
    var pagaExtraNeta = 0;
    var irpfMensual = 0;

    if (pagas === 14) {
      var brutoPaga = bruto / 14.0;
      var irpfPaga = irpfAnual / 14.0;
      netoMensual = Math.max(0, brutoPaga - ssMensual - irpfPaga);
      pagaExtraNeta = Math.max(0, brutoPaga - irpfPaga);
      irpfMensual = irpfPaga;
      if (rowPagaExtra) {
        rowPagaExtra.style.display = 'flex';
      }
      setText(outNetoSubPagas, 'en 14 mensualidades (12 ordinarias + 2 extras)');
    } else {
      netoMensual = netoAnual / 12.0;
      pagaExtraNeta = 0;
      irpfMensual = irpfAnual / 12.0;
      if (rowPagaExtra) {
        rowPagaExtra.style.display = 'none';
      }
      setText(outNetoSubPagas, 'en 12 mensualidades con extras prorrateadas');
    }

    setText(outNetoMensual, formatEuro(netoMensual));
    setText(outNetoExtra, formatEuro(pagaExtraNeta));
    setText(outNetoAnual, formatEuro(netoAnual));
    setText(outIrpfPct, 'Tipo efectivo: ' + formatPercent(tipoEfectivoIRPF));
    setText(outIrpfAnual, formatEuro(irpfAnual) + ' / año');
    setText(outIrpfMensual, '(' + formatEuro(irpfMensual) + ' / mes)');
    setText(outSsPct, 'Tipo cotización: ' + formatPercent(tipoSS));
    setText(outSsAnual, formatEuro(ssAnual) + ' / año');
    setText(outSsMensual, '(' + formatEuro(ssMensual) + ' / mes)');

    var pctNeto = (netoAnual / bruto) * 100.0;
    var pctIrpf = (irpfAnual / bruto) * 100.0;
    var pctSs = (ssAnual / bruto) * 100.0;

    setWidth(barNetoPct, pctNeto);
    setWidth(barIrpfPct, pctIrpf);
    setWidth(barSsPct, pctSs);
    setText(legNeto, formatPercent(pctNeto));
    setText(legIrpf, formatPercent(pctIrpf));
    setText(legSs, formatPercent(pctSs));
  }

  // =========================================================================
  // 5. PANEL 2: FINIQUITO E INDEMNIZACIÓN
  // =========================================================================
  var elFinBruto = document.getElementById('fin-bruto');
  var elFinInicio = document.getElementById('fin-inicio');
  var elFinFin = document.getElementById('fin-fin');
  var elFinMotivo = document.getElementById('fin-motivo');
  var elFinPagas = document.getElementById('fin-pagas');
  var elFinVacaciones = document.getElementById('fin-vacaciones');

  var outFinTotal = document.getElementById('res-fin-total');
  var outFinAntiguedad = document.getElementById('res-fin-antiguedad');
  var outFinDiasIndem = document.getElementById('res-fin-dias-indem');
  var outFinIndem = document.getElementById('res-fin-indemnizacion');
  var outFinBrutoTotal = document.getElementById('res-fin-finiquito-bruto');
  var outDiasMes = document.getElementById('res-dias-mes');
  var outFinSalarioMes = document.getElementById('res-fin-salario-mes');
  var outDiasVacPend = document.getElementById('res-dias-vac-pendientes');
  var outFinVacVal = document.getElementById('res-fin-vacaciones-val');
  var outFinPagasExtra = document.getElementById('res-fin-pagas-extra');

  function parseDateISO(str) {
    if (!str || typeof str !== 'string') {
      return null;
    }
    var parts = str.split('-');
    if (parts.length !== 3) {
      return null;
    }
    var y = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10);
    var d = parseInt(parts[2], 10);
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
      return null;
    }
    return new Date(Date.UTC(y, m - 1, d));
  }

  function calcularFiniquito() {
    var bruto = Math.max(0, readFloat(elFinBruto, 0));
    var dInicio = elFinInicio ? parseDateISO(elFinInicio.value) : null;
    var dFin = elFinFin ? parseDateISO(elFinFin.value) : null;
    var motivo = elFinMotivo ? elFinMotivo.value : 'improcedente';
    var pagas = Math.round(readFloat(elFinPagas, 14)) === 12 ? 12 : 14;
    var vacDisfrutadas = Math.max(0, readFloat(elFinVacaciones, 0));

    if (bruto <= 0 || !dInicio || !dFin || dFin.getTime() < dInicio.getTime()) {
      setText(outFinTotal, '0,00 €');
      setText(outFinAntiguedad, 'Antigüedad calculada: 0 días');
      setText(outFinDiasIndem, 'Días computados de indemnización: 0,00 días');
      setText(outFinIndem, '0,00 €');
      setText(outFinBrutoTotal, '0,00 €');
      setText(outDiasMes, '0');
      setText(outFinSalarioMes, '0,00 €');
      setText(outDiasVacPend, '0,00');
      setText(outFinVacVal, '0,00 €');
      setText(outFinPagasExtra, '0,00 €');
      return;
    }

    var diffDias = Math.round((dFin.getTime() - dInicio.getTime()) / 86400000) + 1;
    var aniosTrabajados = diffDias / 365.0;
    var aniosEnteros = Math.floor(diffDias / 365);
    var mesesResto = Math.floor((diffDias % 365) / 30);
    var diasResto = (diffDias % 365) % 30;

    setText(
      outFinAntiguedad,
      'Antigüedad: ' + aniosEnteros + ' años, ' + mesesResto + ' meses y ' + diasResto + ' días (' + diffDias + ' días)'
    );

    var salarioDiario = bruto / 365.0;
    var diasPorAnio = 0;
    var topeDias = 0;

    if (motivo === 'improcedente') {
      diasPorAnio = 33.0;
      topeDias = 720.0; // 24 mensualidades
    } else if (motivo === 'objetivo') {
      diasPorAnio = 20.0;
      topeDias = 360.0; // 12 mensualidades
    } else if (motivo === 'temporal') {
      diasPorAnio = 12.0;
      topeDias = 99999.0;
    }

    var diasIndem = Math.min(topeDias, aniosTrabajados * diasPorAnio);
    var indemnizacion = Math.min(TOPE_EXENTO_IRPF_DESPIDO, diasIndem * salarioDiario);

    setText(outFinDiasIndem, 'Días computados de indemnización: ' + formatDecimal(diasIndem) + ' días');
    setText(outFinIndem, formatEuro(indemnizacion));

    // 1) Salario de los días trabajados en el mes de salida
    var diaMesSalida = dFin.getUTCDate();
    var salarioMensualOrdinario = bruto / (pagas === 14 ? 14.0 : 12.0);
    var importeMesSalida = Math.min(salarioMensualOrdinario, (diaMesSalida / 30.0) * salarioMensualOrdinario);
    setText(outDiasMes, String(diaMesSalida));
    setText(outFinSalarioMes, formatEuro(importeMesSalida));

    // 2) Vacaciones generadas y no disfrutadas en el año en curso (30 días naturales / año)
    var anioFin = dFin.getUTCFullYear();
    var inicioAnioActual = new Date(Date.UTC(anioFin, 0, 1));
    var inicioComputoVac = dInicio.getTime() > inicioAnioActual.getTime() ? dInicio : inicioAnioActual;
    var diasTrabajadosEsteAnio = Math.max(0, Math.round((dFin.getTime() - inicioComputoVac.getTime()) / 86400000) + 1);
    var vacGeneradas = (diasTrabajadosEsteAnio / 365.0) * 30.0;
    var vacPendientes = Math.max(0, vacGeneradas - vacDisfrutadas);
    var importeVacaciones = vacPendientes * salarioDiario;

    setText(outDiasVacPend, formatDecimal(vacPendientes));
    setText(outFinVacVal, formatEuro(importeVacaciones));

    // 3) Parte proporcional de pagas extra (si son 14 pagas sin prorratear, devengo semestral)
    var importePagasExtra = 0;
    if (pagas === 14) {
      var valorPagaExtra = bruto / 14.0;
      var mesSalida = dFin.getUTCMonth(); // 0..11
      if (mesSalida >= 6) {
        var inicioJul = new Date(Date.UTC(anioFin, 6, 1));
        var inicioSem2 = dInicio.getTime() > inicioJul.getTime() ? dInicio : inicioJul;
        var diasSem2 = Math.max(0, Math.round((dFin.getTime() - inicioSem2.getTime()) / 86400000) + 1);
        importePagasExtra = Math.min(1.0, diasSem2 / 184.0) * valorPagaExtra;
      } else {
        var diasSem1 = diasTrabajadosEsteAnio;
        importePagasExtra = Math.min(1.0, diasSem1 / 181.0) * valorPagaExtra;
      }
    }
    setText(outFinPagasExtra, formatEuro(importePagasExtra));

    var finiquitoBruto = importeMesSalida + importeVacaciones + importePagasExtra;
    var totalCobrar = indemnizacion + finiquitoBruto;

    setText(outFinBrutoTotal, formatEuro(finiquitoBruto));
    setText(outFinTotal, formatEuro(totalCobrar));
  }

  // =========================================================================
  // 6. PANEL 3: COSTE EMPRESA
  // =========================================================================
  var elEmpBruto = document.getElementById('emp-bruto');
  var elEmpContrato = document.getElementById('emp-contrato');
  var elEmpSector = document.getElementById('emp-sector');

  var outEmpCosteAnual = document.getElementById('res-emp-coste-anual');
  var outEmpCosteMensual = document.getElementById('res-emp-coste-mensual');
  var outEmpBrutoVal = document.getElementById('res-emp-bruto-val');
  var outEmpSsTipo = document.getElementById('res-emp-ss-tipo');
  var outEmpSsAnual = document.getElementById('res-emp-ss-anual');
  var outEmpSsMensual = document.getElementById('res-emp-ss-mensual');
  var outEmpCc = document.getElementById('res-emp-cc');
  var outEmpTipoDesempleo = document.getElementById('res-emp-tipo-desempleo');
  var outEmpDesempleo = document.getElementById('res-emp-desempleo');
  var outEmpFogasaFp = document.getElementById('res-emp-fogasa-fp');
  var outEmpMei = document.getElementById('res-emp-mei');
  var outEmpTipoAtep = document.getElementById('res-emp-tipo-atep');
  var outEmpAtep = document.getElementById('res-emp-atep');
  var outEmpNetoEmpleado = document.getElementById('res-emp-neto-empleado');

  var barEmpNeto = document.getElementById('bar-emp-neto-pct');
  var barEmpIrpf = document.getElementById('bar-emp-irpf-pct');
  var barEmpSsTrab = document.getElementById('bar-emp-ss-trab-pct');
  var barEmpSsPatr = document.getElementById('bar-emp-ss-patr-pct');
  var legEmpNeto = document.getElementById('leg-emp-neto');
  var legEmpIrpf = document.getElementById('leg-emp-irpf');
  var legEmpSsTrab = document.getElementById('leg-emp-sstrab');
  var legEmpSsPatr = document.getElementById('leg-emp-sspatr');

  function calcularCosteEmpresa() {
    var bruto = Math.max(0, readFloat(elEmpBruto, 0));
    var contrato = elEmpContrato ? elEmpContrato.value : 'indefinido';
    var tipoAtEp = Math.max(0, readFloat(elEmpSector, 1.50));

    var tipoCC = 23.60;
    var tipoDesempleo = contrato === 'temporal' ? 6.70 : 5.50;
    var tipoFogasa = 0.20;
    var tipoFP = 0.60;
    var tipoMEI = 0.75;
    var tipoTotalEmpresa = tipoCC + tipoDesempleo + tipoFogasa + tipoFP + tipoMEI + tipoAtEp;

    if (bruto <= 0) {
      setText(outEmpCosteAnual, '0,00 €');
      setText(outEmpCosteMensual, 'Equivale a 0,00 € / mes (12 meses)');
      setText(outEmpBrutoVal, '0,00 €');
      setText(outEmpSsTipo, 'Tipo total patronal: ' + formatPercent(tipoTotalEmpresa));
      setText(outEmpSsAnual, '0,00 € / año');
      setText(outEmpSsMensual, '(0,00 € / mes)');
      setText(outEmpCc, '0,00 €');
      setText(outEmpTipoDesempleo, formatPercent(tipoDesempleo));
      setText(outEmpDesempleo, '0,00 €');
      setText(outEmpFogasaFp, '0,00 €');
      setText(outEmpMei, '0,00 €');
      setText(outEmpTipoAtep, formatPercent(tipoAtEp));
      setText(outEmpAtep, '0,00 €');
      setText(outEmpNetoEmpleado, '0,00 €');
      setWidth(barEmpNeto, 0);
      setWidth(barEmpIrpf, 0);
      setWidth(barEmpSsTrab, 0);
      setWidth(barEmpSsPatr, 0);
      setText(legEmpNeto, '0,00%');
      setText(legEmpIrpf, '0,00%');
      setText(legEmpSsTrab, '0,00%');
      setText(legEmpSsPatr, '0,00%');
      return;
    }

    var baseCot = Math.min(bruto, BASE_MAX_SS_2026);
    var cuotaCC = baseCot * (tipoCC / 100.0);
    var cuotaDesempleo = baseCot * (tipoDesempleo / 100.0);
    var cuotaFogasaFp = baseCot * ((tipoFogasa + tipoFP) / 100.0);
    var cuotaMEI = baseCot * (tipoMEI / 100.0);
    var cuotaAtEp = baseCot * (tipoAtEp / 100.0);

    var ssEmpresaAnual = cuotaCC + cuotaDesempleo + cuotaFogasaFp + cuotaMEI + cuotaAtEp;
    var ssEmpresaMensual = ssEmpresaAnual / 12.0;
    var costeAnual = bruto + ssEmpresaAnual;
    var costeMensual = costeAnual / 12.0;

    // Neto estimado del trabajador (perfil estándar soltero sin hijos)
    var tipoSsTrab = contrato === 'temporal' ? 6.55 : 6.50;
    var ssTrabAnual = baseCot * (tipoSsTrab / 100.0);
    var rendPrevio = Math.max(0, bruto - ssTrabAnual - 2000.0);
    var redArt20 = 0;
    if (rendPrevio <= 14047.50) {
      redArt20 = 6498.0;
    } else if (rendPrevio < 19747.50) {
      redArt20 = Math.max(0, 6498.0 - 1.1429 * (rendPrevio - 14047.50));
    }
    var baseLiq = Math.max(0, rendPrevio - redArt20);
    var irpfTrab = Math.max(0, cuotaPorTramosIRPF(baseLiq) - cuotaPorTramosIRPF(5550.0));
    if (bruto <= 15876.0) {
      irpfTrab = 0;
    }
    var netoEmpleado = Math.max(0, bruto - ssTrabAnual - irpfTrab);

    setText(outEmpCosteAnual, formatEuro(costeAnual));
    setText(outEmpCosteMensual, 'Equivale a ' + formatEuro(costeMensual) + ' / mes (12 meses)');
    setText(outEmpBrutoVal, formatEuro(bruto));
    setText(outEmpSsTipo, 'Tipo total patronal: ' + formatPercent(tipoTotalEmpresa));
    setText(outEmpSsAnual, formatEuro(ssEmpresaAnual) + ' / año');
    setText(outEmpSsMensual, '(' + formatEuro(ssEmpresaMensual) + ' / mes)');
    setText(outEmpCc, formatEuro(cuotaCC));
    setText(outEmpTipoDesempleo, formatPercent(tipoDesempleo));
    setText(outEmpDesempleo, formatEuro(cuotaDesempleo));
    setText(outEmpFogasaFp, formatEuro(cuotaFogasaFp));
    setText(outEmpMei, formatEuro(cuotaMEI));
    setText(outEmpTipoAtep, formatPercent(tipoAtEp));
    setText(outEmpAtep, formatEuro(cuotaAtEp));
    setText(outEmpNetoEmpleado, formatEuro(netoEmpleado));

    var pctNeto = (netoEmpleado / costeAnual) * 100.0;
    var pctIrpf = (irpfTrab / costeAnual) * 100.0;
    var pctSsTrab = (ssTrabAnual / costeAnual) * 100.0;
    var pctSsPatr = (ssEmpresaAnual / costeAnual) * 100.0;

    setWidth(barEmpNeto, pctNeto);
    setWidth(barEmpIrpf, pctIrpf);
    setWidth(barEmpSsTrab, pctSsTrab);
    setWidth(barEmpSsPatr, pctSsPatr);
    setText(legEmpNeto, formatPercent(pctNeto));
    setText(legEmpIrpf, formatPercent(pctIrpf));
    setText(legEmpSsTrab, formatPercent(pctSsTrab));
    setText(legEmpSsPatr, formatPercent(pctSsPatr));
  }

  // =========================================================================
  // 7. LISTENERS PASIVOS SIN REASIGNACIÓN DE INPUTS
  // =========================================================================
  function bindInput(el, handler) {
    if (!el) {
      return;
    }
    var tag = el.tagName ? el.tagName.toUpperCase() : '';
    if (tag === 'SELECT') {
      el.addEventListener('change', handler);
    } else {
      el.addEventListener('input', handler);
      el.addEventListener('change', handler);
    }
  }

  bindInput(elNetoBruto, calcularSueldoNeto);
  bindInput(elNetoPagas, calcularSueldoNeto);
  bindInput(elNetoContrato, calcularSueldoNeto);
  bindInput(elNetoEdad, calcularSueldoNeto);
  bindInput(elNetoSituacion, calcularSueldoNeto);
  bindInput(elNetoHijos, calcularSueldoNeto);
  bindInput(elNetoDiscapacidad, calcularSueldoNeto);

  bindInput(elFinBruto, calcularFiniquito);
  bindInput(elFinInicio, calcularFiniquito);
  bindInput(elFinFin, calcularFiniquito);
  bindInput(elFinMotivo, calcularFiniquito);
  bindInput(elFinPagas, calcularFiniquito);
  bindInput(elFinVacaciones, calcularFiniquito);

  bindInput(elEmpBruto, calcularCosteEmpresa);
  bindInput(elEmpContrato, calcularCosteEmpresa);
  bindInput(elEmpSector, calcularCosteEmpresa);

  // Cálculo inicial síncrono único
  calcularSueldoNeto();
  calcularFiniquito();
  calcularCosteEmpresa();
});
