package com.educonnect.controller;

import com.educonnect.dto.RelatorioDTO;
import com.educonnect.service.relatorio.ExportadorRelatorio;
import com.educonnect.service.relatorio.RelatorioService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/relatorios")
@PreAuthorize("hasRole('ADMINISTRADOR')")
public class RelatorioController {

    private final RelatorioService service;
    private final ExportadorRelatorio exportador;

    public RelatorioController(RelatorioService service, ExportadorRelatorio exportador) {
        this.service = service;
        this.exportador = exportador;
    }

    @GetMapping
    public List<RelatorioDTO.TipoDisponivel> tipos() {
        return service.tiposDisponiveis();
    }

    @GetMapping("/{tipo}")
    public RelatorioDTO.Response gerar(@PathVariable String tipo,
                                       @RequestParam(required = false) Long cursoId,
                                       @RequestParam(required = false) Long turmaId,
                                       @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
                                       @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim) {
        return service.gerar(tipo, new RelatorioDTO.Filtro(cursoId, turmaId, inicio, fim));
    }

    @GetMapping("/{tipo}/csv")
    public ResponseEntity<byte[]> csv(@PathVariable String tipo,
                                      @RequestParam(required = false) Long cursoId,
                                      @RequestParam(required = false) Long turmaId,
                                      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
                                      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim) {
        RelatorioDTO.Response relatorio = service.gerar(tipo, new RelatorioDTO.Filtro(cursoId, turmaId, inicio, fim));
        return arquivo(exportador.paraCsv(relatorio), "relatorio-" + tipo + ".csv",
                new MediaType("text", "csv", StandardCharsets.UTF_8));
    }

    @GetMapping("/{tipo}/pdf")
    public ResponseEntity<byte[]> pdf(@PathVariable String tipo,
                                      @RequestParam(required = false) Long cursoId,
                                      @RequestParam(required = false) Long turmaId,
                                      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
                                      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim) {
        RelatorioDTO.Response relatorio = service.gerar(tipo, new RelatorioDTO.Filtro(cursoId, turmaId, inicio, fim));
        return arquivo(exportador.paraPdf(relatorio), "relatorio-" + tipo + ".pdf", MediaType.APPLICATION_PDF);
    }

    private static ResponseEntity<byte[]> arquivo(byte[] conteudo, String nome, MediaType tipo) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(nome).build().toString())
                .contentType(tipo)
                .body(conteudo);
    }
}
