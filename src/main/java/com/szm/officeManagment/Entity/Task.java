package com.szm.officeManagment.Entity;

import jakarta.persistence.*;

@Entity
@Table(name = "tasks")
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String description;
    private Long employeeId; // ID of the assigned employee
    private String employeeName; // Cached name for easy display
    private String status = "Pending"; // Pending, In Progress, Completed

    public Task() {}

    public Task(String title, String description, Long employeeId, String employeeName) {
        this.title = title;
        this.description = description;
        this.employeeId = employeeId;
        this.employeeName = employeeName;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}