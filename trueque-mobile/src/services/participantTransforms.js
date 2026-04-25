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
  return {
    ...emptyParticipantData,
    id: backendParticipant.id || null,
    cedula: normalizeString(
      backendParticipant.cedula || backendParticipant.document || backendParticipant.identification
    ),
    nombreCompleto: normalizeString(
      backendParticipant.nombreCompleto || backendParticipant.name || backendParticipant.fullName
    ),
    celular: normalizeString(
      backendParticipant.celular || backendParticipant.phone || backendParticipant.mobile
    ),
    truequesAnio: normalizeString(
      backendParticipant.truequesAnio || backendParticipant.annualTrades || backendParticipant.tradeCount || 0
    ),
    nombreFinca: normalizeString(
      backendParticipant.nombreFinca || backendParticipant.farmName || backendParticipant.finca
    ),
    latitud: normalizeString(backendParticipant.latitud || backendParticipant.latitude),
    longitud: normalizeString(backendParticipant.longitud || backendParticipant.longitude),
    altitud: normalizeString(backendParticipant.altitud || backendParticipant.altitude),
    municipio: normalizeString(
      backendParticipant.municipio || backendParticipant.municipality
    ),
    corregimiento: normalizeString(backendParticipant.corregimiento),
    vereda: normalizeString(backendParticipant.vereda || backendParticipant.village),
    tipoSuelo: normalizeString(backendParticipant.tipoSuelo || backendParticipant.soilType),
    condicionesClimaticas: normalizeString(
      backendParticipant.condicionesClimaticas || backendParticipant.climateConditions
    ),
    sistemasProductivos: normalizeStringArray(
      backendParticipant.sistemasProductivos || backendParticipant.productiveSystems
    ),
    liderazgo: normalizeStringArray(backendParticipant.liderazgo || backendParticipant.leadership),
    esPreRegistro: Boolean(
      backendParticipant.esPreRegistro ||
        backendParticipant.isPreRegistered ||
        backendParticipant.preRegistered
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
