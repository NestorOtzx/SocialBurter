export function useFormValidator() {
  const required = (value) => {
    if (Array.isArray(value)) {
      return value.length ? '' : 'Este campo es obligatorio';
    }

    if (value === null || value === undefined || String(value).trim() === '') {
      return 'Este campo es obligatorio';
    }

    return '';
  };

  const numeric = (value) => {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    return Number.isNaN(Number(value)) ? 'Número inválido' : '';
  };

  const positiveNumber = (value) => {
    if (value === null || value === undefined || value === '') {
      return 'Este campo es obligatorio';
    }

    if (Number.isNaN(Number(value)) || Number(value) <= 0) {
      return 'Número inválido';
    }

    return '';
  };

  return { required, numeric, positiveNumber };
}
