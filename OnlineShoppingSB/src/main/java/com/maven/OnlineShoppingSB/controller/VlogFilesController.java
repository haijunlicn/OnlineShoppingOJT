package com.maven.OnlineShoppingSB.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.maven.OnlineShoppingSB.dto.VlogFilesDTO;
import com.maven.OnlineShoppingSB.service.VlogFilesService;

import java.util.List;


@RestController
@RequestMapping("/vlog-files")
@CrossOrigin(origins = "http://localhost:4200")
public class VlogFilesController {

    @Autowired
    private VlogFilesService vlogFileService;


    @PostMapping("/create")
    public ResponseEntity<VlogFilesDTO> createVlogFile(@RequestBody VlogFilesDTO dto) {
        VlogFilesDTO created = vlogFileService.createVlogFile(dto.getVlogId(), dto);
        return ResponseEntity.ok(created);
    }

    @GetMapping
    public ResponseEntity<List<VlogFilesDTO>> getFiles(@RequestParam(required = false) Long vlogId) {
        return ResponseEntity.ok(vlogFileService.getFilesByVlogIdOrAll(vlogId));
    }
    @GetMapping("/getbyid/{id}")
    public ResponseEntity<VlogFilesDTO> getById(@PathVariable Long id) {
        VlogFilesDTO dto = vlogFileService.getById(id);
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<VlogFilesDTO> updateFile(@PathVariable Long id, @RequestBody VlogFilesDTO dto) {
        VlogFilesDTO updated = vlogFileService.updateVlogFile(id, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> deleteFile(@PathVariable Long id) {
        vlogFileService.deleteVlogFile(id);
        return ResponseEntity.ok("Vlog file deleted successfully!");
    }
    
}
