package cl.edusaldo.productos.repository;

import cl.edusaldo.productos.model.Categoria;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoriaRepository extends JpaRepository<Categoria, Long> {
  java.util.Optional<Categoria> findByIdAndIdEstablecimiento(Long id, Long idEstablecimiento);

  java.util.List<Categoria> findAllByIdEstablecimiento(Long idEstablecimiento);

  Optional<Categoria> findByNombre(String nombre);

  boolean existsByNombre(String nombre);

  boolean existsByNombreAndIdEstablecimiento(String nombre, Long idEstablecimiento);
}
