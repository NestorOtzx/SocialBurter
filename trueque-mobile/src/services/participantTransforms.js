import { getCategoryLabel, getCategoryUnit, PRACTICE_VALUES } from '../constants/options';
import { emptyParticipantData } from '../store/registroStore';

function normalizeString(value) {
  return value === null || value === undefined ? '' : String(value);
}

function normalizeStringArray(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.filter(Boolean).map((item) => String(item));
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export function createBlankParticipant(cedula = '') {
  return {
    ...emptyParticipantData,
    cedula,
  };
}

export function normalizeParticipantResponse(backendParticipant = {}) {
  const item = backendParticipant;
  return {
    ...emptyParticipantData,
    id: item.id || null,
    cedula: normalizeString(
      item.cedula || item.participantCedula || item.participantcedula || item.document || item.identification
    ),
    nombreCompleto: normalizeString(
      item.nombreCompleto || item.participantName || item.participantname || item.name || item.fullName
    ),
    celular: normalizeString(
      item.celular || item.phone || item.telefono || item.mobile
    ),
    truequesAnio: normalizeString(
      item.truequesAnio || item.annualTrades || item.annualtrades || item.tradeCount || 0
    ),
    nombreFinca: normalizeString(
      item.nombreFinca || item.farmName || item.farmname || item.finca || item.farm_name
    ),
    latitud: normalizeString(item.latitud || item.latitude),
    longitud: normalizeString(item.longitud || item.longitude),
    altitud: normalizeString(item.altitud || item.altitude),
    municipio: normalizeString(
      item.municipio || item.municipality
    ),
    corregimiento: normalizeString(item.corregimiento),
    vereda: normalizeString(item.vereda || item.village),
    tipoSuelo: normalizeString(item.tipoSuelo || item.soilType || item.soiltype || item.soil_type),
    condicionesClimaticas: normalizeString(
      item.condicionesClimaticas || item.climateConditions || item.climateconditions || item.climate_conditions
    ),
    sistemasProductivos: normalizeStringArray(
      item.sistemasProductivos || item.productiveSystems || item.productivesystems || item.productive_systems
    ),
    liderazgo: normalizeStringArray(item.liderazgo || item.leadership),
    esPreRegistro: Boolean(
      item.esPreRegistro ||
        item.isPreRegistered ||
        item.preRegistered
    ),
  };
}

export function mergeParticipantProfile(backendParticipant, cachedProfile) {
  if (!backendParticipant && !cachedProfile) {
    return createBlankParticipant();
  }

  const normalizedBackend = normalizeParticipantResponse(backendParticipant);
  const normalizedCache = normalizeParticipantResponse(cachedProfile);

  return {
    ...emptyParticipantData,
    id: normalizedBackend.id || normalizedCache.id || null,
    cedula: normalizedBackend.cedula || normalizedCache.cedula,
    nombreCompleto: normalizedCache.nombreCompleto || normalizedBackend.nombreCompleto,
    celular: normalizedCache.celular || normalizedBackend.celular,
    truequesAnio: normalizedCache.truequesAnio || normalizedBackend.truequesAnio,
    nombreFinca: normalizedCache.nombreFinca || normalizedBackend.nombreFinca,
    latitud: normalizedCache.latitud || normalizedBackend.latitud,
    longitud: normalizedCache.longitud || normalizedBackend.longitud,
    altitud: normalizedCache.altitud || normalizedBackend.altitud,
    municipio: normalizedCache.municipio || normalizedBackend.municipio,
    corregimiento: normalizedCache.corregimiento || normalizedBackend.corregimiento,
    vereda: normalizedCache.vereda || normalizedBackend.vereda,
    tipoSuelo: normalizedCache.tipoSuelo || normalizedBackend.tipoSuelo,
    condicionesClimaticas:
      normalizedCache.condicionesClimaticas || normalizedBackend.condicionesClimaticas,
    sistemasProductivos: normalizedCache.sistemasProductivos.length
      ? normalizedCache.sistemasProductivos
      : normalizedBackend.sistemasProductivos,
    liderazgo: normalizedCache.liderazgo.length
      ? normalizedCache.liderazgo
      : normalizedBackend.liderazgo,
    esPreRegistro: normalizedBackend.esPreRegistro || normalizedCache.esPreRegistro,
  };
}

export function buildParticipantPayload(formData, username, options = {}) {
  return {
    cedula: normalizeString(formData.cedula).trim(),
    name: normalizeString(formData.nombreCompleto).trim(),
    fullName: normalizeString(formData.nombreCompleto).trim(),
    phone: normalizeString(formData.celular).trim(),
    annualTrades: Number(formData.truequesAnio || 0),
    farmName: normalizeString(formData.nombreFinca).trim(),
    latitude: formData.latitud === '' ? null : Number(formData.latitud),
    longitude: formData.longitud === '' ? null : Number(formData.longitud),
    altitude: formData.altitud === '' ? null : Number(formData.altitud),
    municipality: normalizeString(formData.municipio).trim(),
    corregimiento: normalizeString(formData.corregimiento).trim(),
    village: normalizeString(formData.vereda).trim(),
    soilType: normalizeString(formData.tipoSuelo).trim(),
    climateConditions: normalizeString(formData.condicionesClimaticas).trim(),
    productiveSystems: normalizeStringArray(formData.sistemasProductivos),
    leadership: normalizeStringArray(formData.liderazgo),
    isPreRegistered: options.mode === 'pre',
    esPreRegistro: options.mode === 'pre',
    createdBy: username || 'monitor',
  };
}

export function mapAportesToContributions(aportes, eventYear) {
  return aportes.map((aporte) => {
    const tipo = normalizeString(aporte.tipo).trim();
    const categoria = aporte.categoria;
    const unit = aporte.unidad || getCategoryUnit(categoria);

    return {
      eventYear,
      category: categoria,
      categoria,
      type: tipo,
      tipo,
      quantity: Number(aporte.cantidad),
      cantidad: Number(aporte.cantidad),
      unit,
      unidad: unit,
      stage: 'llega',
      speciesCommonName: tipo || getCategoryLabel(categoria),
      speciesScientificName: tipo || getCategoryLabel(categoria),
      variety: tipo || getCategoryLabel(categoria),
    };
  });
}

export function getContributionDisplayType(item) {
  return (
    item?.tipo ||
    item?.type ||
    item?.variety ||
    item?.speciesCommonName ||
    item?.speciesScientificName ||
    ''
  );
}

export function getContributionDisplayQuantity(item) {
  return Number(item?.cantidad ?? item?.quantity ?? 0);
}

export function getContributionDisplayUnit(item) {
  return item?.unidad || item?.unit || getCategoryUnit(item?.category);
}

export function hasPracticeScore(participantData) {
  return normalizeStringArray(participantData?.sistemasProductivos).some((item) =>
    PRACTICE_VALUES.includes(item)
  );
}

export function hasLeadershipScore(participantData) {
  return normalizeStringArray(participantData?.liderazgo).length > 0;
}

export function hasMissingPredioData(participantData) {
  const sistemas = normalizeStringArray(participantData?.sistemasProductivos);
  const liderazgo = normalizeStringArray(participantData?.liderazgo);

  return [
    participantData?.latitud,
    participantData?.longitud,
    participantData?.altitud,
    participantData?.municipio,
    participantData?.corregimiento,
    participantData?.vereda,
    participantData?.tipoSuelo,
    participantData?.condicionesClimaticas,
  ].some((item) => !normalizeString(item).trim()) || !sistemas.length || !liderazgo.length;
}
