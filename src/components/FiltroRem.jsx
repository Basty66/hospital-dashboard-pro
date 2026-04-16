export function FiltrosREM({ filtros, setFiltros }) {
  return (
    <div className="filters">
      <select
        value={filtros.anio}
        onChange={(e) =>
          setFiltros({ ...filtros, anio: e.target.value })
        }
      >
        <option value="2025">2025</option>
      </select>

      <select
        value={filtros.mes}
        onChange={(e) =>
          setFiltros({ ...filtros, mes: e.target.value })
        }
      >
        <option value="todos">Todos los meses</option>
      </select>

      <select
        value={filtros.servicio}
        onChange={(e) =>
          setFiltros({ ...filtros, servicio: e.target.value })
        }
      >
        <option value="obstetricia">Obstetricia</option>
      </select>
    </div>
  );
}