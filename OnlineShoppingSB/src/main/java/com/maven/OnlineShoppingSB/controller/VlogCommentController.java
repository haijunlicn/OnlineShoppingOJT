package com.maven.OnlineShoppingSB.controller;

import com.maven.OnlineShoppingSB.dto.VlogCommentDTO;
import com.maven.OnlineShoppingSB.service.VlogCommentService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.cassandra.CassandraProperties.Request;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/vlog-comments")
@CrossOrigin(origins = "http://localhost:4200")
public class VlogCommentController {

    @Autowired
    private VlogCommentService commentService;

    @PostMapping("/create")
    public ResponseEntity<VlogCommentDTO> createComment(@RequestBody VlogCommentDTO dto) {
        VlogCommentDTO created = commentService.createComment(dto);
        return ResponseEntity.ok(created);
    }

    @GetMapping("/list/{vlogId}")
    public ResponseEntity<List<VlogCommentDTO>> getCommentsByVlogId(@PathVariable Long vlogId) {
        List<VlogCommentDTO> comments = commentService.getCommentsByVlogId(vlogId);
        return ResponseEntity.ok(comments);
    }
}
