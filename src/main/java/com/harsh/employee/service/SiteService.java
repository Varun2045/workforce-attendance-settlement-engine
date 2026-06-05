package com.harsh.employee.service;

import com.harsh.employee.model.Site;
import java.util.List;

public interface SiteService {
    Site saveSite(Site site);
    List<Site> getAllSites();
}
