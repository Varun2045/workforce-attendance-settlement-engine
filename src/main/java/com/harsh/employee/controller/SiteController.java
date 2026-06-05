package com.harsh.employee.controller;

import com.harsh.employee.model.Site;
import com.harsh.employee.service.SiteService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;

@RestController
@RequestMapping("/api/sites")
@Tag(name = "Site Management", description = "Endpoints for creating and listing construction sites")
public class SiteController {

    private final SiteService siteService;

    public SiteController(SiteService siteService) {
        this.siteService = siteService;
    }

    // Build Create Site REST API
    @PostMapping
    @Operation(summary = "Create a new construction site", description = "Saves a construction site record, capturing its name and location details.")
    public ResponseEntity<Site> saveSite(@RequestBody Site site) {
        return new ResponseEntity<>(siteService.saveSite(site), HttpStatus.CREATED);
    }

    // Build Get All Sites REST API
    @GetMapping
    @Operation(summary = "Get all construction sites", description = "Retrieves a complete list of all registered construction sites.")
    public List<Site> getAllSites() {
        return siteService.getAllSites();
    }
}
